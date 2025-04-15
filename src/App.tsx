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
  const [userProgress, setUserProgress] = useState<{ [key: string]: { [key: string]: number } }>({ 정은: {}, 미숙: {} });
  const [username, setUsername] = useState<string>("");
  const [subjectList, setSubjectList] = useState<string[]>([]);
  const [screen, setScreen] = useState<"userSelect" | "subjectSelect" | "grape">("userSelect");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newSubject, setNewSubject] = useState<string>("");
  const [newTotalLectures, setNewTotalLectures] = useState<number>(0);
  const [totalLectures, setTotalLectures] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const [showCongrats, setShowCongrats] = useState<boolean>(false);
  const [subjectProgress, setSubjectProgress] = useState<{ [key: string]: number }>({});

  const getUserProgress = async (user: string) => {
    const subjectsRef = collection(db, "users", user, "subjects");
    const snapshot = await getDocs(subjectsRef);
    const progressMap: { [key: string]: number } = {};
    const subjects: string[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as { totalLectures: number; completed: boolean[] };
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
        const progressMap: { [key: string]: number } = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as { totalLectures: number; completed: boolean[] };
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
          const data = snap.data() as { totalLectures: number; completed: boolean[] };
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

  const handleToggle = (index: number) => {
    const updated = [...completed];
    updated[index] = !updated[index];
    setCompleted(updated);
    if (updated.every(Boolean)) {
      setShowCongrats(true);
      setTimeout(() => {
        if (
          window.confirm("🎉 모든 강의를 완료했어요! 이 과목 데이터를 삭제할까요?")
        ) {
          handleDeleteSubject(selectedSubject);
        }
      }, 500);
    }
  };

  const handleDeleteSubject = async (subjectToDelete: string) => {
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
    await getUserProgress(username);
    setShowAddForm(false);
  };

  const handleSelectUser = async (user: string) => {
    setUsername(user);
    await getUserProgress(user);
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

  const renderUserProgress = (user: string) => {
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
        <div style={{ padding: "16px", textAlign: "center" }}>
          <h2>오늘도 열심히!</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button onClick={() => handleSelectUser("정은")}>정은</button>
            <button onClick={() => handleSelectUser("미숙")}>미숙</button>
          </div>
          {renderUserProgress("정은")}
          {renderUserProgress("미숙")}
        </div>
      )}

      {screen === "subjectSelect" && (
        <div>
          <h2 style={{ textAlign: "center" }}>{username}님, 과목을 선택하세요</h2>
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <button onClick={() => setShowAddForm(true)}>+ 과목 추가</button>
          </div>
          {showAddForm ? (
            <div style={{ textAlign: "center" }}>
              <input
                type="text"
                placeholder="과목명"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
              <input
                type="number"
                placeholder="총 강의 수"
                value={newTotalLectures || ""}
                onChange={(e) => setNewTotalLectures(parseInt(e.target.value))}
              />
              <div style={{ marginTop: "8px" }}>
                <button onClick={handleSaveSubject}>저장</button>
                <button onClick={() => setShowAddForm(false)}>취소</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  if (e.target.value) setScreen("grape");
                }}
              >
                <option value="">-- 과목 선택 --</option>
                {subjectList.map((s) => (
                  <option key={s} value={s}>
                    {s} ({subjectProgress[s] || 0}%)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button onClick={backToUserSelect}>첫 화면</button>
          </div>
        </div>
      )}

      {screen === "grape" && (
        <div>
          <h2 style={{ textAlign: "center" }}>
            {username}의 {selectedSubject} 진도
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "10px",
              maxHeight: "300px",
              overflowY: "auto",
              padding: "10px",
            }}
          >
            {completed.map((done, index) => (
              <div
                key={index}
                onClick={() => handleToggle(index)}
                style={{
                  borderRadius: "50%",
                  backgroundColor: done ? "#7b4ddc" : "#ccc",
                  color: "#fff",
                  width: "100%",
                  aspectRatio: "1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
          {showCongrats && (
            <p style={{ textAlign: "center", color: "green", fontWeight: "bold" }}>
              🎉 모든 강의를 완료했어요! 축하합니다!
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button onClick={backToUserSelect}>처음</button>
            <button onClick={saveProgress}>저장</button>
            <button onClick={() => handleDeleteSubject(selectedSubject)}>삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}
