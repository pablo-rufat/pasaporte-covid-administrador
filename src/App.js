import './App.css';
import { withAuthenticator } from '@aws-amplify/ui-react'
import { useEffect } from 'react';
import Web3 from "web3";
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { getAdministrador } from "./graphql/queries";
import { createAdministrador } from "./graphql/mutations";
import { Button } from '@material-ui/core';
import { abi } from "./utils/abi";

const web3 = new Web3(
  new Web3.providers.HttpProvider("http://localhost:7545")
);

function App() {

  useEffect(() => {
    const fetchUser = async () => {

      const currentUser = await Auth.currentAuthenticatedUser({ bypassCache: true });
      let userData;

      if (currentUser) {

        console.log("USER_ID: ", currentUser.attributes.sub);

        const apiResponse = await API.graphql(
          graphqlOperation(
            getAdministrador,
            {
              id: currentUser.attributes.sub
            }
          )
        );

        userData = apiResponse.data.getAdministrador;

        console.log("USER_DATA: ", userData);

        if ( !userData ) {

          const newAccount = web3.eth.accounts.create();
          const contrato = new web3.eth.Contract(abi, '0x9ba6865f4aF93a62DAcF0CAEFA0D3fb7dFc82E4b');
          const cfm = `${Math.floor(Math.random() * 10001)}`;

          userData = {
            id: currentUser.attributes.sub,
            address: newAccount.address,
            nome: `Administrador_${Math.floor(Math.random() * 101)}`,
            cpf: '70863586147',
            cfm
          };

          await API.graphql(
            graphqlOperation(
                createAdministrador,
                {
                    input: {
                      ...userData
                    }
                }
            )
          );

          console.log("SALVO NO BD");

          await contrato.methods
            .cadastrarAdministrador(cfm, true)
            .call({ from: newAccount.address })
            .catch(e => console.log(e))
            .then(result => {
              console.log("Contract result: ", result.toString());
            });

        }

        console.log(userData);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await Auth.signOut();
      window.location.reload();
    } catch (error) {
        console.log('error signing out: ', error);
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
    <div className="App">
      <Button onClick={logout}>LOGOUT</Button>
    </div>
  );
}

export default withAuthenticator(App);
