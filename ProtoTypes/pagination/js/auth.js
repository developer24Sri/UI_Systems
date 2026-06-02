import { apiService } from "./service.js";

/* LOGIN */
export async function login(username, password) {
    const response = await apiService.post("/auth/login.php", {
        username,
        password
    });

    console.log("Server response:", response);

    if (response.status === "error") {
        throw new Error(response.message);
    }

    apiService.setToken(response.data.accessToken);
    window.location.href = "dashboard.html";

    return response;
}

/* REGISTER */
export async function register(username,email,password) {
    const response = await apiService.post("/auth/register.php", {
        username,
        email,
        password
    });

    if (response.status === "error") {
        throw new Error(response.message);
    }

    return response;
}

