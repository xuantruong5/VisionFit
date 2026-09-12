import { useState } from "react";
import { StyleSheet, Text } from "react-native"

type WorkoutDay = {
  id: number;
  day: string;
  type: string;
  progress?: number;
  locked: boolean;
};

const WorkoutPlan: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("Kế hoạch tập");

  const tabs: string[] = [
    "Tổng quan",
    "Kế hoạch tập",
    "Chế độ ăn",
  ];

  const workoutDays: WorkoutDay[] = [
    {
      id: 1,
      day: "1 ngày tập luyện",
      type: "toàn thân",
      progress: 0,
      locked: false,
    },
    {
      id: 2,
      day: "2 ngày tập luyện",
      type: "toàn thân",
      locked: true,
    },
    {
      id: 3,
      day: "3 ngày tập luyện",
      type: "toàn thân",
      locked: true,
    },
    {
      id: 4,
      day: "4 ngày tập luyện",
      type: "toàn thân",
      locked: true,
    },
    {
      id: 5,
      day: "5 ngày tập luyện",
      type: "toàn thân",
      locked: true,
    },
  ];

  const handleWorkoutClick = (workout: WorkoutDay) => {
    if (workout.locked) {
      return;
    }

    console.log("Mở ngày tập:", workout.id);
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f4f5f6;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Helvetica,
            Arial,
            sans-serif;
        }

        button {
          font-family: inherit;
        }

        .workout-page {
          width: 100%;
          max-width: 430px;
          min-height: 100vh;
          margin: 0 auto;
          background: #ffffff;
          padding: 10px 14px 90px;
          position: relative;
        }

        /* HEADER */

        .header {
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .header h1 {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #22282b;
        }

        .back-btn {
          position: absolute;
          left: 0;
          border: none;
          background: transparent;
          font-size: 30px;
          color: #82929a;
          cursor: pointer;
        }

        .menu-btn {
          position: absolute;
          right: 0;
          width: 35px;
          height: 35px;
          border: none;
          background: #f4f6f7;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
        }

        .menu-btn div {
          width: 14px;
          height: 1.5px;
          background: #67767e;
          border-radius: 10px;
        }

        /* TABS */

        .tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          margin-bottom: 13px;
          gap: 2px;
        }

        .tab {
          height: 32px;
          border: none;
          background: transparent;
          border-radius: 18px;
          font-size: 11px;
          color: #7894a2;
          cursor: pointer;
          transition: 0.2s;
        }

        .tab.active {
          background: #496979;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(48, 71, 85, 0.2);
        }

        /* BANNER */

        .goal-banner {
          position: relative;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 22px;
          box-shadow: 0 2px 7px rgba(0, 0, 0, 0.08);
        }

        .goal-banner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .goal-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(18, 47, 60, 0.98) 0%,
              rgba(29, 67, 82, 0.86) 42%,
              rgba(27, 63, 76, 0.35) 68%,
              rgba(0, 0, 0, 0.05) 100%
            );
        }

        .goal-content {
          position: absolute;
          left: 13px;
          top: 12px;
          color: white;
          z-index: 2;
        }

        .goal-content h2 {
          font-size: 15px;
          margin: 0 0 4px;
        }

        .goal-type {
          font-size: 9px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .goal-days {
          color: #72ddd5;
          font-size: 8px;
          margin-bottom: 3px;
        }

        .goal-completed {
          font-size: 8px;
          opacity: 0.82;
        }

        .goal-action {
          position: absolute;
          right: 8px;
          bottom: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #17c8bf;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          font-size: 14px;
        }

        /* SECTION */

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
        }

        .section-header span {
          color: #7693a2;
          font-size: 12px;
          font-weight: 500;
        }

        .sort-btn {
          border: none;
          background: transparent;
          color: #18bfb7;
          font-size: 22px;
          cursor: pointer;
        }

        /* WORKOUT CARDS */

        .workout-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .workout-card {
          width: 100%;
          height: 66px;
          border: 1px solid #f0f0f0;
          background: #ffffff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.09);
          transition: 0.15s;
        }

        .workout-card:not(.locked):active {
          transform: scale(0.985);
        }

        .workout-card.locked {
          cursor: default;
        }

        .status-container {
          width: 48px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-shrink: 0;
        }

        .progress {
          width: 39px;
          height: 39px;
          border-radius: 50%;
          border: 1.5px solid #ff5d65;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff5d65;
          font-size: 10px;
          font-weight: 500;
        }

        .lock {
          width: 28px;
          height: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0.38;
          margin-left: 5px;
        }

        .lock-top {
          width: 13px;
          height: 11px;
          border: 1.5px solid #ff8389;
          border-bottom: 0;
          border-radius: 8px 8px 0 0;
        }

        .lock-bottom {
          width: 18px;
          height: 14px;
          border: 1.5px solid #ff8389;
          border-radius: 3px;
        }

        .workout-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-left: 4px;
        }

        .workout-day {
          font-size: 10px;
          color: #8b969b;
        }

        .workout-type {
          font-size: 12px;
          color: #444c50;
          font-weight: 500;
        }

        /* BOTTOM NAV */

        .bottom-nav {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          height: 70px;
          background: #ffffff;
          border-top: 1px solid #eeeeee;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          z-index: 100;
          box-shadow: 0 -3px 10px rgba(0, 0, 0, 0.04);
        }

        .nav-item {
          position: relative;
          border: none;
          background: transparent;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: #4a5053;
          cursor: pointer;
        }

        .nav-icon {
          font-size: 17px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-label {
          font-size: 8px;
        }

        .nav-item.active {
          color: #16bdb5;
        }

        .active-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #ebfbfa;
          color: #16bdb5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -12px;
          font-size: 18px;
        }

        .badge {
          position: absolute;
          top: 7px;
          right: 11px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ff7781;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 7px;
        }

        @media (max-width: 380px) {
          .workout-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .tab {
            font-size: 10px;
          }
        }
      `}</style>

      <div className="workout-page">
        {/* HEADER */}

        <header className="header">
          <button
            className="back-btn"
           // onClick={() => window.history.back()}
            aria-label="Quay lại"
          >
            ‹
          </button>

          <h1>Kế hoạch tập</h1>

          <button
            className="menu-btn"
            aria-label="Menu"
          >
            <div />
            <div />
            <div />
          </button>
        </header>

        {/* TABS */}

        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab
                  ? "tab active"
                  : "tab"
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* GOAL BANNER */}

        <section className="goal-banner">
          <img
            src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
            alt="Kế hoạch giảm cân"
          />

          <div className="goal-overlay" />

          <div className="goal-content">
            <h2>Giảm cân</h2>

            <div className="goal-type">
              🏋️ Tạ nhẹ · Cardio
            </div>

            <div className="goal-days">
              24 ngày tập luyện / 3 buổi mỗi tuần
            </div>

            <div className="goal-completed">
              Tập luyện hoàn tất: 0
            </div>
          </div>

          <div className="goal-action">
            🏃
          </div>
        </section>

        {/* SECTION TITLE */}

        <div className="section-header">
          <span>Ngày tập luyện</span>

          <button
            className="sort-btn"
            aria-label="Sắp xếp"
          >
            ⇅
          </button>
        </div>

        {/* WORKOUT LIST */}

        <div className="workout-list">
          {workoutDays.map((workout) => (
            <button
              key={workout.id}
              className={
                workout.locked
                  ? "workout-card locked"
                  : "workout-card"
              }
              onClick={() =>
                handleWorkoutClick(workout)
              }
            >
              <div className="status-container">
                {workout.locked ? (
                  <div className="lock">
                    <div className="lock-top" />
                    <div className="lock-bottom" />
                  </div>
                ) : (
                  <div className="progress">
                    {workout.progress}%
                  </div>
                )}
              </div>

              <div className="workout-info">
                <span className="workout-day">
                  {workout.day}
                </span>

                <span className="workout-type">
                  {workout.type}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* BOTTOM NAVIGATION */}

        <nav className="bottom-nav">
          <button className="nav-item active">
            <div className="active-icon">
              ☷
            </div>

            <span className="nav-label">
              Kế hoạch tập
            </span>
          </button>

          <button className="nav-item">
            <div className="nav-icon">
              ♨
            </div>

            <span className="nav-label">
              Food
            </span>
          </button>

          <button className="nav-item">
            <div className="nav-icon">
              ◯
            </div>

            <span className="nav-label">
              Tin nhắn
            </span>
          </button>

          <button className="nav-item">
            <div className="nav-icon">
              ▤
            </div>

            <span className="nav-label">
              Sổ tay
            </span>
          </button>

          <button className="nav-item">
            <div className="nav-icon">
              •••
            </div>

            <span className="nav-label">
              Thêm
            </span>

            <div className="badge">
              1
            </div>
          </button>
        </nav>
      </div>
    </>
  );
};

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
})
export default WorkoutPlan;