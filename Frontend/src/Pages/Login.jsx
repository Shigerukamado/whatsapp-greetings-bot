import {useState} from "react";
import {Link} from "react-router-dom";

function Login() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => 
        setForm({
            ...form,
            [e.target.name]
            : e.target.value
        });
     
    const handleSubmit = (e) => {
        e.preventDefualt();
        //To the backend's API ENDPOINT, send the form data for authentication
        console.log("Login", form);
    };


    return (
        <div className ="auth">
            <aside className = "auth-brand">
                <span className ="auth-brand-mark">
                    <Link to = "/">
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
                        <input
                        id = "password"
                        name = "password"
                        type = "password"
                        placeholder = "Enter your password"
                        value = {form.password}
                        onChange = {handleChange}
                        />
                    </div>
                    <button type = "submit" className = "btn btn-primary auth-submit">
                        Sign In
                        </button>
                </form>
            </div>
        </div>
    )
}