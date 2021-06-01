import "./style.css";
import { Button } from "@material-ui/core";

export default function Header({ logout }) {
  return (
    <header>
      <div className='logo'>
        <i className='fas fa-virus-slash'></i>
        <h3>Passaporte Covid</h3>
      </div>
      <Button onClick={logout}>LOGOUT</Button>
    </header>
  );
}
