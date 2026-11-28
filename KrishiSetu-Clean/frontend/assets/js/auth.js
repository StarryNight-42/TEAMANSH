
const roles = [
    {
        name: "Farmer",
        role: "farmer",
        description: "Manage your agricultural products and connect with distributors.",
        icon: "🌾"
    },
    {
        name: "Transporter",
        role: "transporter",
        description: "Manage transportation and deliver agricultural products.",
        icon: "🚚"
    },
    {
        name: "Distributor",
        role: "distributor",
        description: "Connect with farmers and manage product distribution.",
        icon: "🏪"
    }
];

const dashboards = {
    farmer: "farmer.html",
    transporter: "transporter.html",
    distributor: "distributor.html"
};

let selectedRole = "";
let signupMode = false;

const cards = document.getElementById("cards");

roles.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
        <div class="art">${item.icon}</div>
        <h2>${item.name}</h2>
        <p>${item.description}</p>
        <button type="button">Continue as ${item.name}</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
        openModal(item.role);
    });

    cards.appendChild(card);
});

function openModal(role) {
    selectedRole = role;
    signupMode = false;

    document.getElementById("modal").style.display = "flex";
    updateForm();
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("authForm").reset();
    document.getElementById("message").textContent = "";
}

function switchMode() {
    signupMode = !signupMode;
    updateForm();
}

function updateForm() {
    document.getElementById("formTitle").textContent =
        signupMode ? "Create Account" : "Welcome Back";

    document.getElementById("formSubtitle").textContent =
        signupMode
        ? "Register your KrishiSetu account."
        : "Login to your KrishiSetu account.";

    document.getElementById("name").style.display =
        signupMode ? "block" : "none";

    document.getElementById("name").required = signupMode;

    document.getElementById("submitBtn").textContent =
        signupMode ? "Register" : "Login";

    document.getElementById("switchText").textContent =
        signupMode ? "Already have an account?" : "Don't have an account?";

    document.getElementById("switchButton").textContent =
        signupMode ? "Login" : "Create Account";

    document.getElementById("message").textContent = "";
}

document.getElementById("authForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const message = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");

    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait...";
    message.textContent = "";

    try {
        if (signupMode) {
            const name = document.getElementById("name").value.trim();

            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: selectedRole
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Registration failed.");
            }

            signupMode = false;
            updateForm();

            document.getElementById("email").value = email;
            message.style.color = "#32834c";
            message.textContent = "Registration successful! Please login.";

        } else {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.user) {
                throw new Error(data.error || "Invalid email or password.");
            }

            if (data.user.role !== selectedRole) {
                await fetch("/api/logout", {
                    method: "POST"
                });

                throw new Error(
                    "This account belongs to a different account type."
                );
            }

            window.location.href = dashboards[selectedRole];
        }

    } catch (error) {
        message.style.color = "#c0392b";
        message.textContent = error.message || "Something went wrong.";
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = signupMode ? "Register" : "Login";
    }
});

window.addEventListener("click", function(e) {
    if (e.target === document.getElementById("modal")) {
        closeModal();
    }
});

document.getElementById("closeModalButton").addEventListener("click",closeModal);
document.getElementById("switchButton").addEventListener("click",switchMode);
