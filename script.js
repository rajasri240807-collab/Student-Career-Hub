



/* 1. STORAGE KEYS */

const ACCOUNTS_KEY = "sch_accounts";
const CURRENT_USER_KEY = "sch_currentUserEmail";


/* 2. COMMON HELPER FUNCTIONS */

function getAccounts() {
    try {
        return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || [];
    } catch (error) {
        console.error("Unable to read accounts:", error);
        return [];
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getCurrentUserEmail() {
    return sessionStorage.getItem(CURRENT_USER_KEY);
}

function getCurrentUser() {
    const email = getCurrentUserEmail();

    if (!email) {
        return null;
    }

    return getAccounts().find(
        account => account.email === email
    ) || null;
}


/*
   Each user's information gets a separate storage key.

   Example:
   User A -> sch_user_userA@example.com_savedJobs
   User B -> sch_user_userB@example.com_savedJobs
*/

function getUserStorageKey(key) {
    const email = getCurrentUserEmail();

    if (!email) {
        return null;
    }

    return "sch_user_" + encodeURIComponent(email) + "_" + key;
}


/* Read data belonging to the currently logged-in user */

function getUserData(key, defaultValue = []) {
    const storageKey = getUserStorageKey(key);

    if (!storageKey) {
        return defaultValue;
    }

    try {
        const data = localStorage.getItem(storageKey);

        return data === null
            ? defaultValue
            : JSON.parse(data);

    } catch (error) {
        console.error("Unable to read user data:", error);
        return defaultValue;
    }
}


/* Save data belonging to the currently logged-in user */

function setUserData(key, value) {
    const storageKey = getUserStorageKey(key);

    if (!storageKey) {
        alert("Please login to save your information.");
        return false;
    }

    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
        return true;

    } catch (error) {
        console.error("Unable to save user data:", error);
        alert("Unable to save your information in this browser.");
        return false;
    }
}


/* 3. HOME PAGE FUNCTIONS */

function login() {
    window.location.href = "login.html";
}

function register() {
    window.location.href = "register.html";
}

function findJobs() {
    window.location.href = "jobs.html";
}

function findInternships() {
    window.location.href = "internship.html";
}

function resumeBuilder() {
    window.location.href = "resume.html";
}

function profile() {
    alert("Student Profile will open here.");
}


/* 4. REGISTRATION */

document.addEventListener("DOMContentLoaded", function () {

    const registerForm = document.getElementById("registerForm");

    if (!registerForm) {
        return;
    }

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("registerEmail");
        const passwordInput = document.getElementById("registerPassword");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const termsInput = document.getElementById("terms");

        if (
            !nameInput ||
            !emailInput ||
            !passwordInput ||
            !confirmPasswordInput
        ) {
            alert("Registration form fields are missing.");
            return;
        }

        const name = nameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!name) {
            alert("Please enter your full name.");
            nameInput.focus();
            return;
        }

        if (!email) {
            alert("Please enter your email address.");
            emailInput.focus();
            return;
        }

        if (password.length < 6) {
            alert("Password must contain at least 6 characters.");
            passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            confirmPasswordInput.focus();
            return;
        }

        if (termsInput && !termsInput.checked) {
            alert("Please accept the Terms and Conditions.");
            return;
        }

        try {
            const accounts = getAccounts();

            const emailExists = accounts.some(
                account => account.email === email
            );

            if (emailExists) {
                alert("This email is already registered. Please login.");
                window.location.href = "login.html";
                return;
            }

            /*
              Preserve the existing single-account data when upgrading
              the old registration system.

              The legacy data is migrated only for the account that
              matches the old studentEmail value.
            */

            const oldEmail = (
                localStorage.getItem("studentEmail") || ""
            ).trim().toLowerCase();

            if (oldEmail && oldEmail === email) {

                const legacyKeys = [
                    "savedJobs",
                    "appliedJobs",
                    "appliedInternships",
                    "studentResume",
                    "resumeData"
                ];

                legacyKeys.forEach(function (key) {

                    const newKey =
                        "sch_user_" + encodeURIComponent(email) + "_" + key;

                    const oldData = localStorage.getItem(key);

                    if (
                        oldData !== null &&
                        localStorage.getItem(newKey) === null
                    ) {
                        localStorage.setItem(newKey, oldData);
                    }
                });
            }

            const newAccount = {
                name: name,
                email: email,
                password: password
            };

            accounts.push(newAccount);
            saveAccounts(accounts);

            /*
              Keep the old account's basic details available
              for compatibility with existing pages.
            */

            if (oldEmail === email || !oldEmail) {
                localStorage.setItem("studentName", name);
                localStorage.setItem("studentEmail", email);
                localStorage.setItem("studentPassword", password);
            }

            alert(
                "Welcome " + name +
                "! Registration successful. Please login."
            );

            window.location.href = "login.html";

        } catch (error) {

            console.error("Registration error:", error);

            alert("Unable to register. Please try again.");

        }

    });

});


/* 5. LOGIN */

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        if (!emailInput || !passwordInput) {
            alert("Login form fields are missing.");
            return;
        }

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Please enter your email and password.");
            return;
        }

        const accounts = getAccounts();

        /*
          Support the original single account if it exists
          but has not yet been migrated to sch_accounts.
        */

        let account = accounts.find(
            item => item.email === email && item.password === password
        );

        if (!account) {

            const oldEmail = (
                localStorage.getItem("studentEmail") || ""
            ).trim().toLowerCase();

            const oldPassword = localStorage.getItem("studentPassword");
            const oldName = localStorage.getItem("studentName");

            if (
                oldEmail === email &&
                oldPassword === password
            ) {

                account = {
                    name: oldName || "Student",
                    email: oldEmail,
                    password: oldPassword
                };

                if (!accounts.some(item => item.email === email)) {
                    accounts.push(account);
                    saveAccounts(accounts);
                }
            }
        }

        if (!account) {

            if (accounts.length === 0 &&
                !localStorage.getItem("studentEmail")) {

                alert("No account found. Please register first.");
                window.location.href = "register.html";

            } else {

                alert("Invalid email or password. Please try again.");

            }

            return;
        }

        /*
          Store the current session separately from account data.
          Logging out will not delete saved jobs, applications or resume.
        */

        sessionStorage.setItem(CURRENT_USER_KEY, account.email);

        alert("Welcome back, " + account.name + "!");

        window.location.href = "dashboard.html";

    });

});


/* 6. SHOW / HIDE PASSWORD */

document.addEventListener("DOMContentLoaded", function () {

    const togglePassword = document.getElementById("togglePassword");

    if (!togglePassword) {
        return;
    }

    togglePassword.addEventListener("click", function () {

        const passwordInput = document.getElementById("password");

        if (!passwordInput) {
            return;
        }

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            togglePassword.textContent = "🙈";
        } else {
            passwordInput.type = "password";
            togglePassword.textContent = "👁";
        }

    });

});


/* 7. LOGOUT */

function logout() {

    sessionStorage.removeItem(CURRENT_USER_KEY);

    alert("You have been logged out.");

    window.location.href = "index.html";

}


/* 8. CHECK LOGIN STATUS */

function isLoggedIn() {
    return getCurrentUser() !== null;
}


/* 9. GET CURRENT STUDENT NAME */

function getStudentName() {
    const account = getCurrentUser();

    return account ? account.name : "Student";
}


/* 10. PROTECT PAGES THAT REQUIRE LOGIN */

function requireLogin() {

    if (!isLoggedIn()) {
        alert("Please login to continue.");
        window.location.href = "login.html";
        return false;
    }

    return true;
}

