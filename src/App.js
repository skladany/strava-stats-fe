import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import "./App.css";
import testData from "./data/testData";

function App() {
  const capitalize = (s) => {
    if (typeof s !== "string") return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Swapping out Athlete based on the subdomain. Super simple.
  const ATHLETE = window.location.hostname.includes("ashley")
    ? "ashley"
    : "steve";

  const [athlete, setAthlete] = useState(capitalize(ATHLETE));

  const headline =
    "steve" === ATHLETE
      ? `👟 ${athlete} Runs the World! 🏃‍♂️`
      : `🦄 ${athlete} Runs the World! 🏃‍♀️`;

  const [title, setTitle] = useState(headline);

  const [isLoading, setIsLoading] = useState(true);

  const [mileageGoal, setMileageGoal] = useState(2022);
  const [mileageGoalComplete, setMileageGoalStatus] = useState("");

  const [currentMiles, setCurrentMiles] = useState(0);
  const [progressBar, setProgressBar] = useState("0%");

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

  const goalPace = () => {
    // Ideal Pace
    const milesPerDay = mileageGoal / (currDayNumber() + daysLeft());
    const goalPace = currDayNumber() * milesPerDay;

    return goalPace.toFixed(2);
  };

  const currPace = () => {
    return (goalPace() - currentMiles).toFixed(2);
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
    const weeklyGoal =
      weeklyMileageGoal + mile > 0 ? weeklyMileageGoal + mile : 0;
    setWeeklyMileageGoal(weeklyGoal);
    localStorage.setItem("weeklyGoal", weeklyGoal);
  };

  const shootConfetti = () => {
    var duration = 10 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      var particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      );
    }, 250);
  };

  useEffect(() => {
    const loadLocalStorage = () => {
      const weeklyGoal = parseInt(localStorage.getItem("weeklyGoal")) || 40;
      setWeeklyMileageGoal(weeklyGoal);
    };

    const fetchData = async () => {
      const endpoint = `https://api-postal-run.herokuapp.com`;
      //const endpoint = `http://localhost:7777`;

      let page = 1;
      let runData = [];

      if (process.env.NODE_ENV === "development") {
        runData = testData;
      } else {
        while (true) {
          const data = await fetch(
            `${endpoint}/strava/distance_run/${ATHLETE}/?page=${page}&per_page=50`
          ).then((r) => r.json());

          if (data.length < 1) {
            break;
          }

          runData = [...runData, ...data];

          page++;
        } // end while
      }

      // Parse the data
      const distance = runData.reduce((totalDistance, { distance }) => {
        return totalDistance + distance;
      }, 0);
      setCurrentMiles(metersToMiles(distance));

      const today = new Date();
      const monday = startOfWeek(today);

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
    }; // end if/else

    loadLocalStorage();
    fetchData();
  }, [ATHLETE]);

  useEffect(() => {
    setTimeout(() => {
      let progress = ((currentMiles / mileageGoal) * 100).toFixed(2);
      setProgressBar(`${progress}%`);

      // Show some pep if the goal has been met!
      if (progress >= 100) {
        setTimeout(() => {
          setMileageGoalStatus("goal-complete");
          shootConfetti();
        }, 1150);
      }
    }, 1000);
  }, [currentMiles, mileageGoal]);

  return isLoading ? (
    <div className="App">
      <h1>{title}</h1>
      <img src="/loading.gif" />
    </div>
  ) : (
    <div className="App">
      <h1>{title}</h1>
      <div className="progress-bar">
        <div className="bar" style={{ width: progressBar }}></div>
        <p>
          <strong>{currentMiles}</strong> of <strong>{mileageGoal}</strong> 🏁
          miles.
        </p>
      </div>
      <h2 id="goal-status" className={mileageGoalComplete}>
        🎉 You did it!!! 🎉
      </h2>
      <p>
        You are <strong>{currPace()}</strong> miles off your yearly goal pace of{" "}
        <strong>{goalPace()}</strong>.
      </p>
      <p>
        You have <strong>{daysLeft()}</strong> days left to hit your goal!
      </p>
      <p>
        Run <strong>{milesPerDay()}</strong> miles a day to hit your goal!
      </p>
      <p>&hellip;</p>
      <p>
        <strong>{currentWeeklyMiles}</strong> of{" "}
        <strong>{weeklyMileageGoal}</strong> weekly miles.
        <br />
        <strong>
          {parseFloat(weeklyMileageGoal - currentWeeklyMiles).toFixed(2)}
        </strong>{" "}
        to go!!!
      </p>
      <div className="toggles">
        <button onClick={() => toggleMileage(-1)}>👇</button>
        <button onClick={() => toggleMileage(1)}>👆</button>
      </div>
    </div>
  );
}

export default App;
