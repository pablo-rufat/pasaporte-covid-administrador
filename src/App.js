import "./App.css";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { Auth, API, graphqlOperation } from "aws-amplify";
import { getAdministrador } from "./graphql/queries";
import { createAdministrador } from "./graphql/mutations";
import { format } from "date-fns";
import { name, br } from "faker-br";
import abi from "./utils/abi.json";
import contractAddress from "./utils/contractAddress.json";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  CardActions,
  Tooltip,
  Grid,
  Link
} from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { ipfs } from "./ipfs";
import { styled } from '@material-ui/core/styles';
import axios from "axios";
import fileDownload  from "js-file-download";

const Input = styled('input')({
  display: 'none',
});

const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`));
const contrato = new web3.eth.Contract(abi, contractAddress.address);

function App() {
  const [user, setUser] = useState(null);
  const [addUser, setAddUser] = useState(false);
  const [vacinas, setVacinas] = useState([0, 0]);
  const [erroPerm, setErroPerm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroVacina, setErroVacina] = useState("");
  const [erroDocumento, setErroDocumento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataToggle, setDataToggle] = useState(false);
  const [searchFinished, setSearchFinished] = useState(false);
	const [selectedFile, setSelectedFile] = useState({});
	const [isFilePicked, setIsFilePicked] = useState(false);
	const [historyArray, setHistoryArray] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setErroVacina("");
      const currentUser = await Auth.currentAuthenticatedUser({
        bypassCache: true,
      });

      if (currentUser && !user) {
        const apiResponse = await API.graphql(
          graphqlOperation(getAdministrador, {
            id: currentUser.attributes.sub,
          })
        ).catch(console.log);
        const userData = apiResponse.data.getAdministrador;

        if (!userData) setAddUser(true);
        else {
          console.log("entrou");
          console.log(userData);
          setAddUser(false);
          setUser(userData);
          await web3.eth.personal
            .unlockAccount(userData.address, userData.nome, 10000)
            .catch(console.log);
        }
      }
      setLoading(false);
    };
    if (!user) {
      fetchUser();
    }
  }, []);

  useEffect(() => {
    const saveDB = async () => {
      if (addUser) {
        const currentUser = await Auth.currentAuthenticatedUser({
          bypassCache: true,
        });
        const nome = name.findName();
        const contas = await web3.eth.getAccounts();
        const newAccount = await web3.eth.personal.newAccount(nome);
        web3.eth.defaultAccount = newAccount;
        console.log("newAccount", newAccount);
        await web3.eth.getBalance(contas[0], (err, bal) => {
          if (err) throw err;
          console.log("Ganache balance", bal);
        });
        await web3.eth.sendTransaction({
          to: newAccount,
          from: contas[0],
          value: web3.utils.toWei("1", "ether"),
        });
        await web3.eth.getBalance(newAccount, (err, bal) => {
          if (err) throw err;
          console.log("New Account balance", bal);
        });

        const cfm = `${Math.floor(100000 + Math.random() * 900000)}`;

        const userData = {
          id: currentUser.attributes.sub,
          address: newAccount,
          nome: nome,
          cpf: String(br.cpf()),
          cfm,
        };

        //console.log(userData);

        await API.graphql(
          graphqlOperation(createAdministrador, {
            input: {
              ...userData,
            },
          })
        ).catch(console.log);

        console.log("SALVO NO BD");

        try {
          //console.log(userData);
          await web3.eth.personal
            .unlockAccount(newAccount, nome, 10000)
            .catch(console.log);
          await contrato.methods
            .cadastrarAdministrador(userData.cfm, true)
            .send({ from: userData.address })
            .catch(e => console.log(e))
            .then(() => console.log("Cadastrado"));
        } catch (error) {
          console.log(error);
        }

        setUser(userData);
      }
    };
    if (!user) {
      saveDB();
    }
  }, [addUser]);

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      setAddUser(false);
      setVacinas([0, 0]);
      setErroPerm(false);
      setErroVacina("");
      setEndereco("");
      setDataToggle(false);
      setSearchFinished(false);
      await Auth.signOut();
      window.location.reload();
    } catch (error) {
      console.log("error signing out: ", error);
      setLoading(false);
    }
    setLoading(false);
  };

  const searchUser = async e => {
    if (e.key !== "Enter") return;
    setSearchFinished(false);
    console.log(erroPerm);
    setLoading(true);
    setErroVacina("");
    let entrada = e.target.value;
    if (entrada.length === 0) {
      setErroPerm(false);
      setLoading(false);
      return;
    }
    try {
      if (entrada.length === 14 || entrada.length === 11) {
        const cpf = entrada.replace(".", "").replace(".", "").replace("-", "");
      } else if (entrada.length === 42) {
        const momento = new Date();
        console.log(user.address, entrada);
        const vacinas = await contrato.methods
          .getHistoricoDatasVacinas(entrada, momento.getTime())
          .call({ from: user.address })
          .catch(e => {
            setErroPerm(true);
            console.log(e);
          });
        setVacinas([Number(vacinas[0]), Number(vacinas[1])]);
        setErroPerm(false);
        setSearchFinished(true);
      } else {
        console.log("erro");
        setErroPerm(true);
      }
    } catch (error) {
      console.log(error);
      setErroPerm(true);
    }
    setLoading(false);
  };

	const changeHandler = (event) => {
		setSelectedFile(event.target.files[0]);
		setIsFilePicked(true);
    console.log(event.target.files[0]);
    console.log(selectedFile);
    console.log(isFilePicked);
    console.log(endereco);
    // addDocument();
	};

  const addDocument = async () => {
    setLoading(true);
    setErroDocumento("");
    if (endereco === user.address) {
      setErroDocumento("Você não pode adicionar documentos para você mesmo.");
      setLoading(false);
      return;
    }

    if (!isFilePicked) {
      setLoading(false);
      return;
    }

    try {

      await web3.eth.personal.unlockAccount(user.address, user.nome, 10000);

      const added = await ipfs.add(selectedFile);

      console.log(endereco);
      console.log(added);

      await contrato.methods
        .addDocumento(endereco, added.path)
        .send({ from: user.address, gas:6721970 });

    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const downloadFile = async (hash) => {

    await axios.request({
      method: 'POST',
      url: `http://127.0.0.1:5001/api/v0/get?arg=${hash}`,
      responseType: 'arraybuffer',
      responseEncoding: 'binary'
    })
    .then(function (response) {
      const newBuffer = response.data.slice(46);
      fileDownload(newBuffer, 'historico.pdf');
    })
    .catch(function (error) {
      console.log(error);
    });

  };

  const getHistorico = async () => {
    setLoading(true);

    try {
      const momento = new Date().getTime();
      const result = await contrato.methods
        .getDocumentos(endereco, momento)
        .call({ from: user.address })
        .catch(e => {
          setErroPerm(true);
          console.log(e);
        });

      setHistoryArray(result);

    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const aplicarDose = async tipo => {
    setLoading(true);
    setErroVacina("");
    if (endereco === user.address) {
      setErroVacina("Você não pode registrar vacina para você mesmo.");
      setLoading(false);
      return;
    }
    const contas = await web3.eth.getAccounts();
    console.log(contas.some(item => item === user.address));
    await web3.eth.personal.unlockAccount(user.address, user.nome, 10000);

    if (tipo === "dose1") {
      try {
        const momento = new Date().getTime();
        await contrato.methods
          .aplicarPrimeiraDose(momento, endereco)
          .send({ from: user.address });
        setErroVacina("");
        setDataToggle(!dataToggle);
      } catch (error) {
        console.log(error);
        setErroVacina("O cidadão já tomou a primeira dose.");
      }
    } else if (tipo === "dose2") {
      try {
        const momento = new Date().getTime();
        await contrato.methods
          .aplicarSegundaDose(momento, endereco)
          .send({ from: user.address });
        setErroVacina("");
        setDataToggle(!dataToggle);
      } catch (error) {
        console.log(error);
        setErroVacina("O cidadão já tomou a segunda dose.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const getTime = async () => {
      if (searchFinished) {
        try {
          const momento = new Date().getTime();
          const vacinas = await contrato.methods
            .getHistoricoDatasVacinas(endereco, momento)
            .call({ from: user.address });
          setVacinas([Number(vacinas[0]), Number(vacinas[1])]);
          setErroPerm(false);
          setSearchFinished(true);
        } catch (error) {
          setErroPerm(true);
          console.log(error);
        }
      }
    };
    getTime();
  }, [dataToggle]);

  // cadastrarAdministrador(address admin, string calldata cfm, bool ativo)
  // cadastrarCidadao(address cidadao)
  // addDocumento(address cidadao, address ipfs)
  // getDocumentos(address cidadao, uint timestamp)
  // getHistoricoDatasVacinas(address cidadao, uint timestamp)
  // aplicarPrimeiraDose(uint timestamp, address cidadao)
  // aplicarSegundaDose(uint timestamp, address cidadao)
  return (
    <div className='App'>
      <Header logout={logout} />
      <div className='main'>
        {user && (
          <Card className='cardWidth'>
            {loading && (
              <div className='loading'>
                <CircularProgress />
              </div>
            )}
            <CardHeader
              title={user ? user.nome : ""}
              subheader={
                user
                  ? `${user.cpf.substr(0, 3)}.${user.cpf.substr(
                      3,
                      3
                    )}.${user.cpf.substr(6, 3)}-${user.cpf.substr(9, 2)}`
                  : ""
              }
            />
            <CardContent>
              <div className='buscaEnd'>
                <TextField
                  className='inputWidth'
                  onKeyPress={searchUser}
                  id='standard-basic'
                  label='Endereço'
                  value={endereco}
                  onChange={e => setEndereco(e.target.value)}
                />
              </div>
              {erroPerm && (
                <>
                  <br />
                  <MuiAlert elevation={6} variant='filled' severity='error'>
                    Você não possui permissão para visualizar o paciente.
                  </MuiAlert>
                </>
              )}
              {searchFinished && (
                <List>
                  <ListItem>
                    <ListItemText
                      primary='Primeira dose'
                      secondary={
                        user && vacinas[0] !== 0
                          ? format(vacinas[0], "dd/MM/yyyy HH:mm")
                          : "Ainda nada"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary='Segunda dose'
                      secondary={
                        user && vacinas[1] !== 0
                          ? format(vacinas[1], "dd/MM/yyyy HH:mm")
                          : "Ainda nada"
                      }
                    />
                  </ListItem>
                </List>
              )}
              {searchFinished && (
                <Button
                    className='botaoHistorico'
                    color='primary'
                    onClick={() => getHistorico()}
                  >
                    Historico medico
                </Button>
              )}
              {historyArray.map((value, index) => {
                return <Link key={index} href="#" onClick={() => {downloadFile(value);}}> {value} </Link>
              })}
              {searchFinished && vacinas[0] === 0 && (
                <Button
                  className='botaoVacina'
                  color='primary'
                  onClick={() => aplicarDose("dose1")}
                >
                  Aplicar Vacina
                </Button>
              )}
              {searchFinished && (
              <Grid container>
                <Grid item>
                  <label htmlFor="contained-button-file">
                    <Input
                      type='file'
                      id="contained-button-file"
                      onChange={changeHandler}
                    />
                    <Button
                      variant="contained"
                      component="span"
                    >
                      { isFilePicked ? selectedFile.name : "Selecionar arquivo" }
                    </Button>
                  </label>
                </Grid>
                <Grid item>
                  <Button
                    className='botaoUpload'
                    color='primary'
                    onClick={() => addDocument()}
                  >
                    Salvar no historico
                  </Button>
                </Grid>
              </Grid>
              )}
              {searchFinished && vacinas[0] !== 0 && vacinas[1] === 0 && (
                <Button
                  className='botaoVacina'
                  color='primary'
                  onClick={() => aplicarDose("dose2")}
                >
                  Aplicar Vacina
                </Button>
              )}
              {erroVacina && (
                <MuiAlert elevation={6} variant='filled' severity='error'>
                  {erroVacina}
                </MuiAlert>
              )}
            </CardContent>
            <CardActions>
              <Tooltip title='Copiar endereço'>
                <Button
                  size='small'
                  color='primary'
                  onClick={() =>
                    navigator.clipboard.writeText(user ? user.address : "")
                  }
                >
                  {user ? user.address : ""}
                </Button>
              </Tooltip>
            </CardActions>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default withAuthenticator(App);

//<PhotoCameraIcon className='cameraIcon' />
