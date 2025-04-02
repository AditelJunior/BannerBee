import React, { useEffect, useState, useRef } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider, signInAnonymously, signInWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { useNavigate } from "react-router";
// import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../state/store";

// import { setUser, setLoading, setError, clearUser } from "../../state/userInfo/userInfo";

import './styles.scss';

// import GoogleLogo from "./../../images/logo-google.png";
import MicrosoftLogo from "./../../images/microsoft-logo.png";
import AnonynousUserLogo from "./../../images/anonymous-user.png";

const Login = () => {
    const auth = getAuth();
    // const { user, loading, error } = useSelector((state: RootState) => state.userInfo);
    // const dispatch = useDispatch();

    const [user, setUser ] = useState<any>(null);
    const [emailInput, setEmailInput ] = useState<string>('');
    const [passwordInput, setPasswordInput ] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);


    const passwordInputRef = useRef<HTMLInputElement>(null);
    const showPasswordButtonRef = useRef<HTMLButtonElement>(null);
    const faceRef = useRef<HTMLDivElement>(null);
    const tongueRef = useRef<HTMLDivElement>(null);

    let throttleTimeout: NodeJS.Timeout | null = null;

    let navigate = useNavigate();

    useEffect(() => {  
        if (user) {
            navigate('/');
        }
        
    }, [user])
    
    const showPasswordButtonHandler = () => {
        if(passwordInputRef.current) {
            if (passwordInputRef.current.type === 'text') {
                passwordInputRef.current.type = 'password'
                if (showPasswordButtonRef.current) {
                    showPasswordButtonRef.current.textContent = 'Show';
                }
                document.querySelectorAll('.hand').forEach(hand => {
                    hand.classList.remove('peek')
                    hand.classList.add('hide')
                })

            } else {
                passwordInputRef.current.type = 'text'
                if (showPasswordButtonRef.current) {
                    showPasswordButtonRef.current.textContent = 'Hide';
                }
                document.querySelectorAll('.hand').forEach(hand => {
                hand.classList.remove('hide')
                hand.classList.add('peek')
                })
            }
        }
    }
    const emailOnFocusHandler = () => {

        if (faceRef.current) {
            let length = Math.min(emailInput.length - 16, 19);
            document.querySelectorAll('.hand').forEach(hand => {
                hand.classList.remove('hide');
                hand.classList.remove('peek');
            });
            faceRef.current.style.setProperty('--rotate-head', `${-length}deg`);
        }
    }
    const emailChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailInput(e.target.value);
        if (!throttleTimeout) {
            throttleTimeout = setTimeout(() => {
                if (faceRef.current) {
                    let length = Math.min(e.target.value.length - 16, 19);
                    faceRef.current.style.setProperty('--rotate-head', `${-length}deg`);
                }
                throttleTimeout = null;
            }, 100);
        }
    };
    const passwordOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (tongueRef.current) {
            setPasswordInput(e.target.value)
            document.querySelectorAll('.hand').forEach(hand => {
                hand.classList.add('hide')
            })
            tongueRef.current.classList.remove('breath')
        }

    }
    const passwordOnBlurHandler = () => {
        if (tongueRef.current) {
            document.querySelectorAll('.hand').forEach(hand => {
                hand.classList.remove('hide')
                hand.classList.remove('peek')
            })
            tongueRef.current.classList.add('breath')
        }
    }
    const emailOnBlurHandler = () => {
        if (faceRef.current) {
            faceRef.current.style.setProperty('--rotate-head', '0deg')
        }
    }
    
    
    // Google Sign-In
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                setUser(result.user)
            })
            .catch((error) => {
                console.error("Google Sign-In Error:", error);
            });
    };

    // Microsoft Sign-In
    const signInWithMicrosoft = () => {
        const provider = new OAuthProvider('microsoft.com');
        signInWithPopup(auth, provider)
            .then((result) => {
                setUser(result.user);
                console.log("Microsoft User:", user);
            })
            .catch((error) => {
                console.error("Microsoft Sign-In Error:", error);
            });
    };

    // Email/Password Sign-Up
    const signUpWithEmailAndPassword = (email: string, password: string) => {
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;

                // Send verification email
                sendEmailVerification(user)
                    .then(() => {
                        // console.log("Verification email sent to:", user.email);
                        alert("A verification email has been sent to your email address. Please verify your email before logging in.");
                    })
                    .catch((error) => {
                        setErrorMessage("Failed to send verification email. Please try again.");
                    });
                if (userCredential.user.emailVerified) {
                    setUser(userCredential.user);
                    setErrorMessage(null);
                } else {
                    setErrorMessage("Please verify your email before logging in.");
                    signOut(auth); // Ensure unverified users are signed out
                }
            })
            .catch((error) => {
                handleAuthError(error);
            });
    };
    const loginWithEmailAndPassword = (email: string, password: string) => {
        // Sign-In Logic
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                if (userCredential.user.emailVerified) {
                    setUser(userCredential.user);
                    setErrorMessage(null);
                } else {
                    setErrorMessage("Please verify your email before logging in.");
                    signOut(auth); // Ensure unverified users are signed out
                }
            })
            .catch((error) => {
                handleAuthError(error);
            });
    }
    // Anonymous Sign-In
    const signInAnonymouslyHandler = () => {
        signInAnonymously(auth)
            .then((result) => {
                setUser(result.user);
                console.log("Anonymous User:", result.user);
            })
            .catch((error) => {
                console.error("Anonymous Sign-In Error:", error);
            });
    };
    const handleAuthError = (error: any) => {
        let message = "An error occurred. Please try again.";
        switch (error.code) {
            case "auth/email-already-in-use":
                message = "This email is already in use. Please use a different email.";
                break;
            case "auth/invalid-email":
                message = "The email address is not valid. Please enter a valid email.";
                break;
            case "auth/weak-password":
                message = "The password is too weak. Please use a stronger password.";
                break;
            case "auth/user-not-found":
                message = "No user found with this email. Please check your email or sign up.";
                break;
            case "auth/wrong-password":
                message = "The password is incorrect. Please try again.";
                break;
            case "auth/popup-closed-by-user":
                message = "The sign-in popup was closed before completing the sign-in process.";
                break;
            default:
                message = error.message; // Use the default Firebase error message
                break;
        }
        setErrorMessage(message);
        console.error("Authentication Error:", error);
    };

    return (
        <div className='login-container'>
            <div className="center">
                <div className="ear ear--left"></div>
                <div className="ear ear--right"></div>
                <div className="face" ref={faceRef}>
                    <div className="eyes">
                        <div className="eye eye--left">
                            <div className="glow"></div>
                        </div>
                        <div className="eye eye--right">
                            <div className="glow"></div>
                        </div>
                    </div>
                    <div className="nose"><svg width="38.161" height="22.03"><path d="M2.017 10.987Q-.563 7.513.157 4.754C.877 1.994 2.976.135 6.164.093 16.4-.04 22.293-.022 32.048.093c3.501.042 5.48 2.081 6.02 4.661q.54 2.579-2.051 6.233-8.612 10.979-16.664 11.043-8.053.063-17.336-11.043z" fill="#243946"></path></svg>
                        <div
                            className="glow"></div>
                </div>
                <div className="mouth"><svg className="smile" viewBox="-2 -2 84 23" width="84" height="23"><path d="M0 0c3.76 9.279 9.69 18.98 26.712 19.238 17.022.258 10.72.258 28 0S75.959 9.182 79.987.161" fill="none" strokeWidth="3" strokeLinecap="square" strokeMiterlimit="3"></path></svg>
                    <div
                        className="mouth-hole"></div>
                <div className="tongue breath" ref={tongueRef}>
                    <div className="tongue-top"></div>
                    <div className="line"></div>
                    <div className="median"></div>
                </div>
            </div>
            </div>
            <div className="hands">
                <div className="hand hand--left">
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                </div>
                <div className="hand hand--right">
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                    <div className="finger">
                        <div className="bone"></div>
                        <div className="nail"></div>
                    </div>
                </div>
            </div>
            <div className="login">
                <label><div className="fa fa-phone"></div>
                <input 
                    className="email" 
                    type="text" 
                    placeholder="email"
                    onBlur={(e) => {emailOnBlurHandler()}}
                    onFocus={(e) => {emailOnFocusHandler()}}
                    onChange={(e)=>emailChangeHandler(e)}/>
                </label>
            <label>
                <input 
                    className="password" 
                    type="password" 
                    placeholder="Password" 
                    ref={passwordInputRef}
                    onBlur={(e)=>passwordOnBlurHandler()}
                    onChange={(e)=>passwordOnChangeHandler(e)}/>
                <button className="password-button" onClick={(e)=>showPasswordButtonHandler()}>Show</button>
            </label>
            {errorMessage ? <div className="error-message">{errorMessage}</div> : null}
                <button className="login-button" onClick={() => loginWithEmailAndPassword(emailInput, passwordInput)}>Login</button>
                <button className="login-button" onClick={() => signUpWithEmailAndPassword(emailInput, passwordInput)}>SignUp</button>
            </div>
            <div className="social-buttons">
                <button className="social" onClick={signInWithGoogle}>
                    <svg fill="#fff" width="30px" height="30px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M473.16,221.48l-2.26-9.59H262.46v88.22H387c-12.93,61.4-72.93,93.72-121.94,93.72-35.66,0-73.25-15-98.13-39.11a140.08,140.08,0,0,1-41.8-98.88c0-37.16,16.7-74.33,41-98.78s61-38.13,97.49-38.13c41.79,0,71.74,22.19,82.94,32.31l62.69-62.36C390.86,72.72,340.34,32,261.6,32h0c-60.75,0-119,23.27-161.58,65.71C58,139.5,36.25,199.93,36.25,256S56.83,369.48,97.55,411.6C141.06,456.52,202.68,480,266.13,480c57.73,0,112.45-22.62,151.45-63.66,38.34-40.4,58.17-96.3,58.17-154.9C475.75,236.77,473.27,222.12,473.16,221.48Z"/></svg>
                </button>
                {/* <button className="social" onClick={signInWithMicrosoft}>
                    <img src={MicrosoftLogo} className='microsoft_logo' alt="microsoft logo" />
                </button> */}
                {/* <button className="social" onClick={signInAnonymouslyHandler}>
                    <img src={AnonynousUserLogo} className='anon_logo' alt="Anonynous User logo" />
                </button> */}
            </div>
            <div className="footer">BannerBee</div>
            </div>
        </div>
    )
}

export default Login