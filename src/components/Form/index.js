import { Button, TextField } from '@material-ui/core';
import { API, graphqlOperation } from 'aws-amplify';
import { useState } from 'react';
import Web3 from "web3";
import { createAdministrador } from "../../graphql/mutations";
import "./style.css";

const web3 = new Web3(
    new Web3.providers.HttpProvider("http://localhost:8545")
  );

export default function Header(props) {

    const [ name, setName ] = useState();
    const [ cpf, setCPF ] = useState();
    const [ birth, setBirth ] = useState();

    const onSubmit = async (event) => {
        try {
            event.preventDefault();

            const newAccount = web3.eth.accounts.create();

            const userData = {
                id: props.userId,
                address: newAccount.address,
                name,
                cpf,
                dataNascimento: birth
            };

            console.log(userData);

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

            props.setModalAberto(false);
            window.location.reload();

        }catch(e) {
            console.error(e);
        }
    };

  return (
    <form noValidate autoComplete="off" onSubmit={onSubmit} >
        <br />
        <br />
        <br />
        <br />
        <TextField id="standard-basic" label="Nome completo" onChange={event => setName(event.target.value)} />
        <br />
        <br />
        <TextField id="standard-basic" label="CPF" onChange={event => setCPF(event.target.value)} />
        <br />
        <br />
        <TextField
            id="date"
            label="Data de nascimento"
            type="date"
            defaultValue="1991-09-11"
            InputLabelProps={{
                shrink: true,
            }}
            onChange={event => setBirth(event.target.value)}
        />
        <br />
        <br />
        <br />
        <br />
        <Button variant="contained" color="primary" type="submit">
            Cadastro
        </Button>
    </form>
  );
}
