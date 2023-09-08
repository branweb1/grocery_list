import React, {useState, useEffect} from "react";
import styles from './menus.css';
import otherStyles from './app.css';
import { Link } from 'react-router-dom';

async function deleteMenu(menuId) {
  return await fetch(`http://localhost:5000/api/groceries/v1/menus/${menuId}`, {method: 'DELETE'});
}

async function fetchMenus() {
  const response = await fetch('http://localhost:5000/api/groceries/v1/menus');
  const menus = await response.json();
  return menus;
}

export function Menus() {
  const [menus, setMenus] = useState([]);
  const [textBoxes, setTextBoxes] = useState(0);
  const [values, setValues] = useState([]);

  useEffect(() => {
    fetchMenus().then(menus => {
      setMenus(menus);
    });
  }, []);

  const handleClick = (menuId) => {
    if (window.confirm('are you sure?')) {
      deleteMenu(menuId).then(() =>
        setMenus(menus => menus.filter(m => m.id !== menuId))
      );
    }
  }

  const handleChange = (idx, e) => {
    const x = [...values]
    x[idx] = e.target.value;
    setValues(x);
  }

  const handleAddClick = () => {
    setTextBoxes(tbs => tbs + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(
      'http://localhost:5000/api/groceries/v1/menus',
      {
        headers: { "Content-Type": "application/json"},
        method: 'POST',
        body: JSON.stringify({name: values[0]})
      })
      .then(r => r.json())
      .then(b => setMenus(menus => [...menus, b]))
      .then(() => {
        setValues([]);
        setTextBoxes(0)
      }).catch(e => console.error(e))
  }

  return (
    <div id="menus">
      <div>
        <h5 className="subheader">Menus</h5>
        <button onClick={handleAddClick}>+ Add New Menu</button>
      </div>
      <ul className={styles.menuList}>
        {menus.map(menu => {
          return (
            <li key={menu.id}>
              <Link to={`http://localhost:5000/menus/${menu.id}/meals`}>
                {menu.name}
              </Link>
              <button
                className={otherStyles.closeButton}
                onClick={() => handleClick(menu.id)}>
                [X]
              </button>
            </li>
          )
        })}
      </ul>
      {!!textBoxes && <form onSubmit={handleSubmit}>
        {[...Array(textBoxes).keys()].map(idx => {
          return (
            <input
              placeholder="e.g. my winter menu"
              name={`new-menu-${idx}`}
              key={`asdf-${idx}`}
              value={values[idx] || ''}
              onChange={(e) => handleChange(idx, e)}
              type="text"
              className={styles.menuInput}/>
          )
        })}
        <input type="submit" value="add"/>
      </form>}
    </div>
  );
}
