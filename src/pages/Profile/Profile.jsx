import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { Link } from "react-router";
import './styles.scss';


import { FaArrowLeft } from "react-icons/fa";
import { FaUser } from "react-icons/fa";

const Profile = () => {
    const [user, setUser] = useState(null);

    // Fetch user info on component mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null); // User is signed out
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    // Handle Sign Out
    const handleSignOut = () => {
        if(window.confirm("Are you sure you want to Sign Out?")) {
            signOut(auth)
                .then(() => {
                    console.log("User signed out successfully.");
                    setUser(null);
                })
                .catch((error) => {
                    console.error("Error signing out:", error);
                });
        }
    };

    if (!user) {
        return (
            <div className="container">
                <h1>Profile</h1>
                <p>You are not logged in. Please log in to view your profile.</p>
                <Link to="/login">Login page</Link>
            </div>
        );
    }

    return (
        <div className="container profile-container">
            <Link to="/" className="back_link">
                <FaArrowLeft /> Back to Chat
            </Link>
            <h1>Profile</h1>
            <div className="profile-info">
                {
                    user.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt="Profile"
                            className="profile-photo"
                        />
                    ) : <div className='profile-photo'><FaUser /></div>
                }
                <p><strong>Name:</strong> {user.displayName || "Anonymous"}</p>
                <p><strong>Email:</strong> {user.email || "No email provided"}</p>
                <p><strong>Email Verified:</strong> {user.emailVerified ? "Yes" : "No"}</p>
            </div>
            <button onClick={handleSignOut} className="sign-out-button">
                Sign Out
            </button>
        </div>
    );
};

export default Profile;
