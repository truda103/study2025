import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import "./styles.css";

const firebaseConfig = {
  apiKey: "AIzaSyDaMMpR5wLFcj0okayQmkYIGw6NgI_EktI",
  authDomain: "study2025-653a6.firebaseapp.com",
  projectId: "study2025-653a6",
  storageBucket: "study2025-653a6.firebasestorage.app",
  messagingSenderId: "357783055192",
  appId: "1:357783055192:web:086b7c93621eea4b66532d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [userProgress, setUserProgress] = useState({ 정은: {}, 미숙: {} });
  const [username, setUsername] = useState("");
  const [subjectList, setSubjectList] = useState([]);
  const [screen, setScreen] = useState("userSelect");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newTotalLectures, setNewTotalLectures] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [showCongrats, setShowCongrats] = useState(false);
  const [subjectProgress, setSubjectProgress] = useState({});

  const getUserProgress = async (user) => {
    const subjectsRef = collection(db, "users", user, "subjects");
    const snapshot = await getDocs(subjectsRef);
    const progressMap = {};
    const subjects = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      subjects.push(docSnap.id);
      if (data.totalLectures > 0) {
        const percent = Math.round(
          (data.completed.filter(Boolean).length / data.totalLectures) * 100
        );
        progressMap[docSnap.id] = percent;
      }
    });

    setSubjectList(subjects.sort((a, b) => a.localeCompare(b)));
    setSubjectProgress(progressMap);
  };

  useEffect(() => {
    const fetchAllUserProgress = async () => {
      for (const user of ["정은", "미숙"]) {
        const subjectsRef = collection(db, "users", user, "subjects");
        const snapshot = await getDocs(subjectsRef);
        const progressMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.totalLectures > 0) {
            const percent = Math.round(
              (data.completed.filter(Boolean).length / data.totalLectures) * 100
            );
            progressMap[docSnap.id] = percent;
          }
        });
        setUserProgress((prev) => ({ ...prev, [user]: progressMap }));
      }
    };
    fetchAllUserProgress();
  }, [username]);

  useEffect(() => {
    const fetchSubject = async () => {
      if (username && selectedSubject) {
        const ref = doc(db, "users", username, "subjects", selectedSubject);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setTotalLectures(data.totalLectures);
          setCompleted(data.completed);
          setShowCongrats(data.completed.every(Boolean));
        }
      }
    };
    fetchSubject();
  }, [selectedSubject]);

  const saveProgress = async () => {
    const ref = doc(db, "users", username, "subjects", selectedSubject);
    await setDoc(ref, { totalLectures, completed });
    setScreen("subjectSelect");
  };

  const handleToggle = (index) => {
    const updated = [...completed];
    updated[index] = !updated[index];
    setCompleted(updated);
    if (updated.every(Boolean)) {
      setShowCongrats(true);
      setTimeout(() => {
        if (
          window.confirm(
            "🎉 모든 강의를 완료했어요! 이 과목 데이터를 삭제할까요?"
          )
        ) {
          handleDeleteSubject(selectedSubject);
        }
      }, 500);
    }
  };

  const handleDeleteSubject = async (subjectToDelete) => {
    const ref = doc(db, "users", username, "subjects", subjectToDelete);
    await deleteDoc(ref);
    await getUserProgress(username);
    setSelectedSubject("");
    setCompleted([]);
    setTotalLectures(0);
    setShowCongrats(false);
    setScreen("subjectSelect");
  };

  const handleSaveSubject = async () => {
    const ref = doc(db, "users", username, "subjects", newSubject);
    await setDoc(ref, {
      totalLectures: newTotalLectures,
      completed: Array(newTotalLectures).fill(false),
    });

    setNewSubject("");
    setNewTotalLectures(0);

    await getUserProgress(username); // ✅ 과목 저장 후 즉시 반영

    setShowAddForm(false);
  };

  const handleSelectUser = async (user) => {
    setUsername(user);
    await getUserProgress(user); // ✅ 사용자 선택 후 과목 정보 불러오기
    setScreen("subjectSelect");
  };

  const backToSubjectSelect = () => {
    setScreen("subjectSelect");
    setShowCongrats(false);
  };

  const backToUserSelect = () => {
    setUsername("");
    setSelectedSubject("");
    setSubjectList([]);
    setScreen("userSelect");
  };

  const renderUserProgress = (user) => {
    const progress = userProgress[user];
    const subjects = Object.keys(progress);
    if (!subjects.length) return <p>{user}: 수강 중인 과목 없음</p>;
    return (
      <div style={{ marginBottom: "20px", width: "100%", maxWidth: "700px" }}>
        <h3 style={{ marginBottom: "10px" }}>{user}님의 수강 현황</h3>
        {subjects.map((subject) => (
          <div key={subject} style={{ marginBottom: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              <span>{subject}</span>
              <span>{progress[subject] || 0}%</span>
            </div>
            <div
              style={{
                backgroundColor: "#eee",
                height: "16px",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress[subject] || 0}%`,
                  height: "100%",
                  backgroundColor: "#7b4ddc",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container">
      {screen === "userSelect" && (
        <div
          className="user-select"
          style={{ maxWidth: "100%", padding: "16px" }}
        >
          <h2 style={{ textAlign: "center" }}>오늘도 열심히!</h2>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <button onClick={() => handleSelectUser("정은")}>정은</button>
            <button onClick={() => handleSelectUser("미숙")}>미숙</button>
          </div>
          {renderUserProgress("정은")}
          {renderUserProgress("미숙")}
        </div>
      )}

      {screen === "subjectSelect" && (
        <div className="subject-select">
          <h2 style={{ textAlign: "center" }}>
            {username}님, 과목을 선택하세요
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "10px",
            }}
          >
            <button onClick={() => setShowAddForm(true)}>+ 과목 추가</button>
          </div>
          {showAddForm ? (
            <div className="add-form">
              <input
                type="text"
                placeholder="과목명 입력"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <input
                type="number"
                placeholder="총 강의 수"
                value={newTotalLectures > 0 ? newTotalLectures : ""}
                onChange={(e) =>
                  setNewTotalLectures(parseInt(e.target.value) || 0)
                }
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <button onClick={handleSaveSubject}>저장</button>
                <button onClick={() => setShowAddForm(false)}>취소</button>
              </div>
            </div>
          ) : (
            <div className="dropdown-area">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedSubject(value);
                  if (value) setScreen("grape");
                }}
              >
                <option value="">-- 과목 선택 --</option>
                {subjectList.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj} ({subjectProgress[subj] || 0}%)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            <button
              onClick={backToUserSelect}
              style={{ fontSize: "14px", padding: "6px 12px" }}
            >
              첫 화면
            </button>
          </div>
        </div>
      )}

      {screen === "grape" && (
        <div className="grape-area">
          <h2 style={{ textAlign: "center" }}>
            {username}의 {selectedSubject} 진도
          </h2>
          <div
            className="grape-cluster"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "8px",
              padding: "10px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {completed.map((isDone, index) => (
              <div
                key={index}
                className={`grape ${isDone ? "filled" : ""}`}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  backgroundColor: isDone ? "#7b4ddc" : "#ccc",
                  color: "white",
                  cursor: "pointer",
                }}
                onClick={() => handleToggle(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
          {showCongrats && (
            <div className="congrats">
              🎉 모든 강의를 완료했어요! 축하합니다! 🎉
            </div>
          )}
          <div
            className="button-group"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <button onClick={backToUserSelect}>처음</button>
            <button onClick={saveProgress}>저장</button>
            <button onClick={() => handleDeleteSubject(selectedSubject)}>
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
