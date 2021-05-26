import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react'
import { useEffect, useState } from 'react';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Form from "./components/Form";
import Web3 from "web3";
import { Auth, API, graphqlOperation } from 'aws-amplify';
import * as abi from "./utils/abi.json";
import { getAdministrador } from "./graphql/queries";
import { Button, Card, CardActions, CardContent, CardHeader, CircularProgress, List, ListItem, ListItemText, Tooltip } from '@material-ui/core';
import QRCode from "qrcode.react";

const web3 = new Web3(
  new Web3.providers.HttpProvider("http://localhost:8545")
);

function App() {

  const [ userData, setUserData ] = useState(null);
  const [ dose1, setDose1 ] = useState(null);
  const [ dose2, setDose2 ] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [ userId, setUserId ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {

      const currentUser = await Auth.currentAuthenticatedUser({ bypassCache: true });

      if (currentUser) {

        setUserId(currentUser.attributes.sub);

        const apiResponse = await API.graphql(
          graphqlOperation(
            getAdministrador,
            {
              id: currentUser.attributes.sub
            }
          )
        );

        setUserData(apiResponse.data.getAdministrador);

        if ( userData ) {

          const contrato = new web3.eth.Contract(abi, userData.address);

          await contrato.methods
            .timestampPrimeiraDose()
            .call({ from: userData.address })
            .catch(e => console.log(e))
            .then(result => {
              setDose1(Number(result));
            });

          await contrato.methods
            .timestampSegundaDose()
            .call({ from: userData.address })
            .catch(e => console.log(e))
            .then(result => {
              setDose2(Number(result));
            });
        }

        console.log(userData);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      setUserData(null);
      setDose1(null);
      setDose2(null);
      setUserId(null);
      await Auth.signOut();
      window.location.reload();
    } catch (error) {
        console.log('error signing out: ', error);
    }
  };

  return (
    <div className="App">
      <div className={modalAberto ? "overlay" : "esconder"}>
        <div className='stats'>
          <button onClick={() => setModalAberto(false)} className='fecharModal'>
            &times;
          </button>
          <Form
            userId={userId}
            setModalAberto={setModalAberto}
          />
        </div>
      </div>
      <Header
        setModalAberto={setModalAberto}
        registered={!!userData}
        logout={logout}
      />
      { loading && <CircularProgress /> }
      { !loading && !!userData && <main>
          <Card>
            <CardHeader
              title={userData ? userData.name : ""}
              subheader={userData ? userData.cpf : ""}
            />
            <CardContent>
              <QRCode value={userData.address} />
              <List>
                <ListItem>
                  <ListItemText primary="Primeira dose" secondary={userData && dose1 ? dose1 : "Ainda nada"} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Primeira dose" secondary={userData && dose2 ? dose2 : "Ainda nada"} />
                </ListItem>
              </List>
            </CardContent>
            <CardActions>
              <Tooltip title="Copiar endereço">
                <Button size="small" color="primary" onClick={navigator.clipboard.writeText(userData ? userData.address : "")}>
                  {userData ? userData.address : ""}
                </Button>
              </Tooltip>
            </CardActions>
          </Card>
        </main>
      }
      <Footer />
    </div>
  );
}

export default withAuthenticator(App);
