import "./App.css";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import Web3 from "web3";
import { Auth, API, graphqlOperation } from "aws-amplify";
import { getAdministrador } from "./graphql/queries";
import { createAdministrador } from "./graphql/mutations";
import { format } from "date-fns";
import { name, br } from "faker-br";
import PhotoCameraIcon from "@material-ui/icons/PhotoCamera";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from "@material-ui/core";
import MuiAlert from "@material-ui/lab/Alert";
import { abi } from "./utils/abi";
import Footer from "./components/Footer";
import Header from "./components/Header";

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const contrato = new web3.eth.Contract(
  abi,
  "0x783244f44fD48d95a8f486A118d0Dd7142500769"
);

function App() {
  const [user, setUser] = useState(null);
  const [vacinas, setVacinas] = useState([0, 0]);
  const [erroPerm, setErroPerm] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const indice = localStorage.getItem("indice");
      if (!indice) {
        localStorage.setItem("indice", "1");
      }
      let indiceTratado = Number(indice);
      const currentUser = await Auth.currentAuthenticatedUser({
        bypassCache: true,
      });
      let userData;

      if (currentUser) {
        console.log("USER_ID: ", currentUser.attributes.sub);

        const apiResponse = await API.graphql(
          graphqlOperation(getAdministrador, {
            id: currentUser.attributes.sub,
          })
        );

        userData = apiResponse.data.getAdministrador;

        console.log("USER_DATA: ", userData);
        setUser(userData);
        console.log(indiceTratado);
        if (!userData) {
          const contas = await web3.eth.getAccounts();

          const cfm = `${Math.floor(100000 + Math.random() * 900000)}`;

          userData = {
            id: currentUser.attributes.sub,
            address: contas[indiceTratado],
            nome: name.findName(),
            cpf: br.cpf(),
            cfm,
          };

          await API.graphql(
            graphqlOperation(createAdministrador, {
              input: {
                ...userData,
              },
            })
          );

          console.log("SALVO NO BD");
          indiceTratado++;
          localStorage.setItem("indice", indiceTratado);
          setUser(userData);
        }

        console.log(userData);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const addAdmin = async () => {
      try {
        if (user) {
          console.log(user.cfm, user.address);
          await contrato.methods
            .cadastrarAdministrador(user.cfm, true)
            .send({ from: user.address })
            .catch(e => console.log(e))
            .then(() => console.log("Cadastrado"));
        }
      } catch (error) {
        console.log(error);
      }
    };
    addAdmin();
  }, [user]);

  const logout = async () => {
    try {
      await Auth.signOut();
      window.location.reload();
    } catch (error) {
      console.log("error signing out: ", error);
    }
  };

  const searchUser = async e => {
    if (e.key !== "Enter") return;
    let entrada = e.target.value;
    try {
      if (entrada.length === 14 || entrada.length === 11) {
        const cpf = entrada.replace(".", "").replace(".", "").replace("-", "");
        console.log(cpf);
      } else if (entrada.length === 42) {
        console.log("endereco");
        const momento = new Date();
        console.log(user.address, entrada);
        try {
          const vacinas = await contrato.methods
            .getHistoricoDatasVacinas(entrada, momento.getTime())
            .call({ from: user.address });
          console.log(vacinas[0], vacinas[1]);
          setVacinas([Number(vacinas[0]), Number(vacinas[1])]);
          setErroPerm(false);
        } catch (error) {
          setErroPerm(true);
          console.log("deu ruim!!!", error.revert);
        }
      } else {
        console.log("erro");
      }
    } catch (error) {
      console.log(error);
    }
  };

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
          <Card className='teste'>
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
                  onKeyPress={searchUser}
                  id='standard-basic'
                  label='Endereço'
                />
                <PhotoCameraIcon />
              </div>

              {erroPerm && (
                <>
                  <br />
                  <MuiAlert elevation={6} variant='filled' severity='error'>
                    Você não possui permissão para visualizar o paciente.
                  </MuiAlert>
                </>
              )}
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
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default withAuthenticator(App);
