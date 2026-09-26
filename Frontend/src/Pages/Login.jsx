import {useState} from "react";
import {Link} from "react-router-dom";
import "./Auth.css";


function Login() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const handleChange = (e) => 
        setForm({
            ...form,
            [e.target.name]
            : e.target.value
        });
     
    const handleSubmit = (e) => {
        e.preventDefault();
        //To the backend's API ENDPOINT, send the form data for authentication
        console.log("Login", form);
    };


    return (
        <div className ="auth">
            <aside className = "auth-brand">
                <span className="auth-brand-mark">
                     <Link to="/" className="auth-brand-link">
                     <img src="/kaabo_logo_concept.png" className="auth-brand-logo" />
                     Kaabo
                     </Link>
                </span>
                <div className = "auth-brand-quote">
                    <h2>Welcome to Kaabo</h2>
                    <p> Your Calender's been running while you were away</p>
                </div>
                <span className = "auth-brand-visual">
                    © {new Date().getFullYear()} Kaabo. All rights reserved.
                </span>
            </aside>

            <div className = "auth-panel">
                <form className = "auth-form" onSubmit={handleSubmit}>
                    <h1>Sign IN</h1>
                    <p className = "auth-form-sub ">
                        New here? <Link to = "/register">Create an account</Link>
                    </p>
                    
                    <div className = "field">
                        <label htmlFor = "email">Email</label>
                        <input
                        id = "email"
                        name = "email"
                        type = "email"
                        placeholder = "Enter your email"
                        value = {form.email}
                        onChange = {handleChange}
                        />
                    </div>
                    <div className = "field">
                        <label htmlFor = "password">Password</label>
                        <div className="field-password-wrap">
                            <input
                            id = "password"
                            name = "password"
                            type = {showPassword ? "text" : "password"}
                            placeholder = "Enter your password"
                            value = {form.password}
                            onChange = {handleChange}
                            />
                            <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button> 
                                </div>
                                </div>
                    <button type = "submit" className = "btn btn-primary auth-submit">
                        Sign In
                        </button>
                </form>
            </div>
        </div>
    )
}
export default Login;

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.87 18.87 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
