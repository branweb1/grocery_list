import React, {useState, useEffect} from "react";
import styles from './app.css';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';

async function fetchMenus() {
  const response = await fetch('http://localhost:3000/api/menus');
  const menus = await response.json();
  return menus;
}

function Home() {
  const [menus, setMenus] = useState([]);
  useEffect(() => {
    fetchMenus().then(menus => {
      setMenus(menus);
    });
  }, []);

  return (
    <div className={styles.container}>
      <header>
        <h3>Grocery List</h3>
        <ul>
          {menus.map(menu => {
            return <Link to={`http://localhost:3000/menus/${menu.id}/meals`}><li>{menu.name}</li></Link>
          })}
        </ul>
      </header>
    </div>
  );
}

async function fetchMealsForMenu(menuId) {
  const response = await fetch(`http://localhost:3000/api/menus/${menuId}/meals`);
  const meals = await response.json();
  return meals
}

function Foo() {
  const { menuId } = useParams();
  const [meals, setMeals] = useState([]);
  useEffect(() => {
    fetchMealsForMenu(menuId).then(meals => setMeals(meals))
  }, []);

  return (
    <ul>
      {meals.map(meal => <li>{meal.name}</li>)}
    </ul>
  );
}

export function App() {
  return (<Router>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/menus/:menuId/meals" element={<Foo />} />
    </Routes>
  </Router>);
}
