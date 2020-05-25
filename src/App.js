import React, { useState, useEffect } from "react";
import "./App.css";
import testData from "./testData.js";

function App() {
  // const [isLoading, setIsLoading] = useState(true);
  const [mileageGoal, setMileageGoal] = useState(2020);
  const [currentMiles, setCurrentMiles] = useState(0);

  const currDayNumber = () => {
    const today = new Date();
    const day = Math.ceil(
      (today - new Date(today.getFullYear(), 0, 1)) / 86400000
    );

    return day;
  };

  const daysLeft = () => {
    const today = new Date();
    const day = Math.floor(
      (new Date(today.getFullYear() + 1, 0, 1) - today) / 86400000
    );

    return day;
  };

  const milesPerDay = () => {
    return parseFloat((mileageGoal - currentMiles) / daysLeft()).toFixed(2);
  };

  const metersToMiles = (meters) => {
    return (meters * 0.000621371).toFixed(2);
  };

  useEffect(() => {
    const fetchData = async () => {
      const endpoint = `https://tranquil-garden-10879.herokuapp.com`;
      //const endpoint = `http://localhost:7777`;

      let page = 1;
      let runData = [];

      // Spare the API during development
      if (process.env.NODE_ENV === "development") {
        runData = JSON.parse(testData);

        const distance = runData.reduce((distance, activities) => {
          return activities[0].distance + distance;
        }, 0);

        const runs = runData.reduce((runs, activities) => {
          return activities[0].runs + runs;
        }, 0);

        setCurrentMiles(metersToMiles(distance));
      } else
        while (true) {
          const data = await fetch(
            `${endpoint}/strava/distance_run?page=${page}&per_page=50`
          ).then((r) => r.json());

          if (data.length < 1) {
            break;
          }

          console.log(data);

          runData.push(data);

          const distance = runData.reduce((distance, activities) => {
            return activities[0].distance + distance;
          }, 0);

          const runs = runData.reduce((runs, activities) => {
            return activities[0].runs + runs;
          }, 0);

          setCurrentMiles(metersToMiles(distance));

          page++;
        } // end while
    }; // end if/else

    fetchData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🦄 Ashley Runs the World! 🏃‍♀️</h1>
        <p>
          {currentMiles} of {mileageGoal} miles.
        </p>
        <p>You have {daysLeft()} days to hit your goal!</p>
        <p>Run {milesPerDay()} miles a day to hit your goal!</p>
      </header>
    </div>
  );
}

export default App;
