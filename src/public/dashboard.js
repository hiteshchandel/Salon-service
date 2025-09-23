const token = sessionStorage.getItem("token"); // assume JWT token stored after login
let userRole = sessionStorage.getItem("role"); // will be set after fetching profile

// Elements
const contentArea = document.getElementById("content-area");
const navProfile = document.getElementById("nav-profile");
const navServices = document.getElementById("nav-services");
const navAppointments = document.getElementById("nav-appointments");
const navStaff = document.getElementById("nav-staff");
const navAvailability = document.getElementById("nav-availability");
const navUsers = document.getElementById("nav-users");
const logoutBtn = document.getElementById("logoutBtn");

// Logout
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/";
});

// Fetch user profile
async function fetchProfile() {
    const res = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.user) {
        // userRole = data.user.role;
        renderProfile(data.user);
        setupSidebar();
    }
}

// Sidebar visibility based on role
// function setupSidebar() {
//     if (userRole === "customer") {
//         navUsers.style.display = "none";
//         navAvailability.style.display = "none";
//     }
//     if (userRole === "staff") {
//         navUsers.style.display = "none";
//         navServices.style.display = "none"; // admin only
//     }
//     if (userRole === "admin") {
//         navAvailability.style.display = "none";
//     }
// }

// Render profile
function renderProfile(user) {
    contentArea.innerHTML = `
        <h3>Profile</h3>
        <p><b>Name:</b> ${user.name}</p>
        <p><b>Email:</b> ${user.email}</p>
        <p><b>Phone:</b> ${user.phone || "-"}</p>
        <p><b>Role:</b> ${user.role}</p>
        <button onclick="editProfile()">Edit Profile</button>
    `;
}

// Edit profile form
function editProfile() {
    contentArea.innerHTML = `
        <h3>Edit Profile</h3>
        <form id="profileForm">
            <input type="text" id="name" placeholder="Name" /><br/><br/>
            <input type="email" id="email" placeholder="Email" /><br/><br/>
            <input type="text" id="phone" placeholder="Phone" /><br/><br/>
            <button type="submit">Save</button>
        </form>
    `;

    document.getElementById("profileForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const mobile = document.getElementById("phone").value;

        const res = await fetch("/api/users/me", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, mobile })
        });
        const data = await res.json();
        alert(data.message);
        fetchProfile();
    });
}

// Render services
async function renderServices() {
    const res = await fetch("/api/services/");
    const data = await res.json();

    let html = `<h3>Services</h3><table>
        <tr><th>Name</th><th>Duration</th><th>Price</th></tr>`;
    data.services.forEach(s => {
        html += `<tr>
            <td>${s.name}</td>
            <td>${s.duration} mins</td>
            <td>₹${s.price}</td>
        </tr>`;
    });
    html += `</table>`;
    contentArea.innerHTML = html;
}

// Render appointments
async function renderAppointments() {
    const res = await fetch("/api/appointments/", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    let html = `<h3>Appointments</h3><table>
        <tr><th>Service</th><th>Staff</th><th>Date</th><th>Time</th><th>Status</th><th>Payment</th></tr>`;
    data.appointments.forEach(a => {
        html += `<tr>
            <td>${a.Service.name}</td>
            <td>${a.Staff.name}</td>
            <td>${a.date}</td>
            <td>${a.startTime} - ${a.endTime}</td>
            <td>${a.status}</td>
            <td>${a.Payment.status}</td>
        </tr>`;
    });
    html += `</table>`;
    contentArea.innerHTML = html;
}

// Render staff profiles (admin & customer)
async function renderStaff() {
    const res = await fetch("/api/staff/");
    const data = await res.json();

    let html = `<h3>Staff Profiles</h3><table>
        <tr><th>Name</th><th>Email</th><th>Phone</th><th>Bio</th><th>Rating</th></tr>`;
    data.staff.forEach(s => {
        html += `<tr>
            <td>${s.name}</td>
            <td>${s.email}</td>
            <td>${s.phone || '-'}</td>
            <td>${s.bio || '-'}</td>
            <td>${s.avgRating || 0}</td>
        </tr>`;
    });
    html += `</table>`;
    contentArea.innerHTML = html;
}

// Event listeners
navProfile.addEventListener("click", fetchProfile);
navServices.addEventListener("click", renderServices);
navAppointments.addEventListener("click", renderAppointments);
navStaff.addEventListener("click", renderStaff);

// On load
fetchProfile();
