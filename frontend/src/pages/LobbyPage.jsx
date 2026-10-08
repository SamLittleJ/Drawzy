import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import api, { clearToken, getErrorMessage } from '../api';
import styles from './LobbyPage.module.css';

const DEFAULT_SETTINGS = { maxPlayers: 6, roundTime: 60, maxRounds: 5, targetScore: 100, isPublic: false };

const NUMBER_FIELDS = [
  { key: 'maxPlayers', label: 'Max Players:' },
  { key: 'roundTime', label: 'Drawing Time (seconds):' },
  { key: 'maxRounds', label: 'Rounds:' },
  { key: 'targetScore', label: 'Target Score:' },
];

export default function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [code, setCode] = useState('');
  const [rooms, setRooms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  // RoomPage sends players back here with a reason when it can't join a room.
  const [error, setError] = useState(location.state?.error ?? '');

  const loadRooms = async () => {
    try {
      const { data } = await api.fetchRooms();
      setRooms(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load rooms'));
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const updateSetting = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const createRoom = async () => {
    setError('');
    try {
      const { data } = await api.createRoom({
        max_players: settings.maxPlayers,
        round_time: settings.roundTime,
        max_rounds: settings.maxRounds,
        target_score: settings.targetScore,
        is_public: settings.isPublic,
      });
      navigate(`/rooms/${data.code}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create room'));
    }
  };

  const joinRoomByCode = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      navigate(`/rooms/${trimmed}`);
    }
  };

  const logout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <h1>Lobby</h1>

      {error && <div role="alert">{error}</div>}

      <div className={styles.section}>
        <h2>Join Room</h2>
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Enter room code"
            aria-label="Room code"
            value={code}
            className={styles.input}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinRoomByCode()}
          />
          <button className={styles.button} onClick={joinRoomByCode}>
            Join
          </button>
        </div>
      </div>

      <div className={styles.section}>
        {!showCreateForm ? (
          <button className={styles.button} onClick={() => setShowCreateForm(true)}>
            Create Room
          </button>
        ) : (
          <>
            <h2>Create Room</h2>
            {NUMBER_FIELDS.map(({ key, label }) => (
              <div className={styles.formRow} key={key}>
                <label className={styles.label} htmlFor={key}>
                  {label}
                </label>
                <input
                  id={key}
                  type="number"
                  min={1}
                  value={settings[key]}
                  className={styles.input}
                  onChange={(e) => updateSetting(key, Number(e.target.value))}
                />
              </div>
            ))}
            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="isPublic">
                Public:
              </label>
              <select
                id="isPublic"
                className={styles.input}
                value={String(settings.isPublic)}
                onChange={(e) => updateSetting('isPublic', e.target.value === 'true')}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button className={styles.button} onClick={createRoom}>
                Submit
              </button>
              <button className={styles.button} onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.section}>
        <h2>Available Rooms</h2>
        <button className={styles.button} onClick={loadRooms}>
          Refresh
        </button>
        <ul className={styles.list}>
          {rooms.map((room) => (
            <li key={room.code} className={styles.listItem}>
              Code: {room.code} | Players: {room.player_count}/{room.max_players} | Time: {room.round_time}s
              <button className={styles.button} onClick={() => navigate(`/rooms/${room.code}`)}>
                Join
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button className={`${styles.button} ${styles.logoutButton}`} onClick={logout}>
        Logout
      </button>
    </div>
  );
}
