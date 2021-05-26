import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVirusSlash } from "@fortawesome/free-solid-svg-icons";
import "./style.css";
import { Button } from "@material-ui/core";

export default function Header(props) {

  return (
    <header>
      <div className='logo'>
        <FontAwesomeIcon icon={faVirusSlash} />
        <h3>Passaporte Covid</h3>
      </div>

      { !props.registered && <Button onClick={() => props.setModalAberto(true)}> REGISTRO </Button> }
      { props.registered && <Button onClick={() => props.logout()}> LOGOUT </Button> }
    </header>
  );
}
