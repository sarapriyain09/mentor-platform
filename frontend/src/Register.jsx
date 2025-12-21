import { useState } from "react";
import { registerUser } from "./api";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "mentor",
  });

  const submit = async () => {
    const res = await registerUser(form);
    alert(JSON.stringify(res));
  };

  return (
    <div>
      <h2>Register</h2>
      <input placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input placeholder="Password" type="password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <select onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="mentor">Mentor</option>
        <option value="mentee">Mentee</option>
      </select>
      <button onClick={submit}>Register</button>
    </div>
  );
}
