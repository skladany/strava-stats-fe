import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [mileageGoal, setMileageGoal] = useState(2020);
  const [currentMiles, setCurrentMiles] = useState(0);

  const [weeklyMileageGoal, setWeeklyMileageGoal] = useState(40);
  const [currentWeeklyMiles, setCurrentWeeklyMiles] = useState(0);

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

  // Get the start of the week, given the current date
  // https://www.w3resource.com/javascript-exercises/javascript-date-exercise-50.php
  const startOfWeek = (date) => {
    const day = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

    date.setDate(day);
    date.setHours(0, 0, 0, 0);

    return new Date(date);
  };

  const toggleMileage = (mile) => {
    const weeklyGoal = weeklyMileageGoal + mile;
    setWeeklyMileageGoal(weeklyGoal);
    localStorage.setItem("weeklyGoal", weeklyGoal);
  };

  useEffect(() => {
    const loadLocalStorage = () => {
      const weeklyGoal = parseInt(localStorage.getItem("weeklyGoal")) || 40;
      setWeeklyMileageGoal(weeklyGoal);
    };

    const fetchData = async () => {
      const endpoint = `https://tranquil-garden-10879.herokuapp.com`;
      //const endpoint = `http://localhost:7777`;

      let page = 1;
      let runData = [];

      // Spare the API during development
      // if (process.env.NODE_ENV !== "development") {
      //   // const testData =
      //   //   '[[{"distance":185106.50000000003,"runs":21}],[{"distance":173474.39999999997,"runs":19}],[{"distance":174614.1,"runs":22}],[{"distance":190920.3,"runs":19}],[{"distance":213984.49999999997,"runs":16}],[{"distance":136323.2,"runs":15}]]';
      //   // runData = JSON.parse(testData);
      //   // const distance = runData.reduce((distance, activities) => {
      //   //   return activities[0].distance + distance;
      //   // }, 0);
      //   // const runs = runData.reduce((runs, activities) => {
      //   //   return activities[0].runs + runs;
      //   // }, 0);
      //   // setCurrentMiles(metersToMiles(distance));
      // } else
      while (true) {
        const data = await fetch(
          `${endpoint}/strava/distance_run?page=${page}&per_page=50`
        ).then((r) => r.json());

        if (data.length < 1) {
          break;
        }

        runData = [...runData, ...data];

        // runData.push(data);

        // const distance = runData.reduce((distance, activities) => {
        //   return activities[0].distance + distance;
        // }, 0);

        // const runs = runData.reduce((runs, activities) => {
        //   return activities[0].runs + runs;
        // }, 0);

        // setCurrentMiles(metersToMiles(distance));

        page++;
      } // end while

      // Parse the data

      const distance = runData.reduce((totalDistance, { distance }) => {
        return totalDistance + distance;
      }, 0);
      setCurrentMiles(metersToMiles(distance));

      const today = new Date();
      const monday = startOfWeek(today);
      console.log(monday);

      const thisWeek = runData
        .filter(({ start_date }) => {
          // @todo this is UTC time, need to account for timezones eventually
          // ...but generally close enough for now
          const activityDate = new Date(start_date);

          return activityDate > monday;
        })
        .reduce((totalDistance, { distance }) => {
          return totalDistance + distance;
        }, 0);
      setCurrentWeeklyMiles(metersToMiles(thisWeek));

      setIsLoading(false);

      // const runs = runData.reduce((runs, activities) => {
      //   return activities[0].runs + runs;
      // }, 0);
    }; // end if/else

    loadLocalStorage();
    fetchData();
  }, []);

  return isLoading ? (
    <div className="App">
      <header className="App-header">
        <h1>🦄 Ashley Runs the World! 🏃‍♀️</h1>
        <img src="/loading.gif" />
      </header>
    </div>
  ) : (
    <div className="App">
      <header className="App-header">
        <h1>🦄 Ashley Runs the World! 🏃‍♀️</h1>
        <p>
          <strong>{currentMiles}</strong> of <strong>{mileageGoal}</strong>{" "}
          yearly miles.
        </p>
        <p>
          <strong>{currentWeeklyMiles}</strong> of{" "}
          <strong>{weeklyMileageGoal}</strong> weekly miles.
          <br />
          <strong>{weeklyMileageGoal - currentWeeklyMiles}</strong> to go!!!
        </p>
        <div className="toggles">
          <button onClick={() => toggleMileage(-1)}>👇</button>
          <button onClick={() => toggleMileage(1)}>👆</button>
        </div>
        <p>
          You have <strong>{daysLeft()}</strong> days to hit your goal!
        </p>
        <p>
          Run <strong>{milesPerDay()}</strong> miles a day to hit your goal!
        </p>
      </header>
    </div>
  );
}

export default App;
