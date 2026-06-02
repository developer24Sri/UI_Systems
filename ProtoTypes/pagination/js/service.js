// service.js

const BASE_URL = "http://localhost/pagination";
// change once, app-wide

let refreshPromise = null;

class ApiService {
    #token = null;

    /* ======================
       AUTH TOKEN HANDLING
       ====================== */

    setToken(token) {
        this.#token = token;
        
    }
    //we have getToken bcos our accessToken is in-memory.
    getToken() {
        return this.#token;
    }

    clearToken() {
        this.#token = null;
    }

    async logout() {
        try {
            await fetch(`${BASE_URL}/auth/logout.php`, {
                method: "POST",
                credentials: "include"
            })
        } catch (err) {
            console.error("Logout request failed");
        }

        this.clearToken();
        window.location.href = "/pagination/auth.html";
    }

    /* ======================
      REFRESH ACCESS TOKEN
      ====================== */

    async refreshToken() {
        const response = await fetch(`${BASE_URL}/auth/refresh.php`, {
            method: "POST",
            credentials: "include"
        })

        if (!response.ok) {
            throw new Error("Refesh failed");
        }

        const data = await response.json();

        this.setToken(data.data.accessToken);
        return data.data.accessToken;
    }

    /* ======================
      AUTH RECOVERY HANDLER
      ====================== */

    async handle401(originalRequest) {

        if (originalRequest.endpoint.includes("/auth/refresh.php")) {
            await this.logout();
            throw new Error("Refresh token invalid");
        }

        if (!refreshPromise) {
            refreshPromise = this.refreshToken()
                .catch(async (err) => {
                    await this.logout();
                    throw err;
                })
                .finally(() => {
                    refreshPromise = null;
                });
        }

        await refreshPromise;

        return this.request({
            ...originalRequest,
            retry: false
        });
    }

    /* ======================
       CORE REQUEST ENGINE
       ====================== */

    async request({ method = "GET", endpoint, data, headers = {}, retry = true }) {
        const config = {
            method,
            credentials: "include", //required for cookies.
            headers: {
                "Content-Type": "application/json",
                ...headers,
                ...(this.#token && { Authorization: `Bearer ${this.#token}` })
            }
        };

        if (data && method !== "GET") {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        // handles 401 authentication failure:(who are you?)
        if (response.status === 401 && retry) {
            return this.handle401({ method, endpoint, data, headers, retry });
        }
        // handles authorization failure:(I know who you are. you're not allowed.)
        if (response.status === 403) {
            throw { type: "FORBIDDEN" };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `HTTP Error ${response.status}`);
        }

        const result = await response.json();

        if (result.status === "error") {
            throw new Error(result.message);
        }

        return result;

    }

    /* ======================
       CRUD HELPERS
       ====================== */

    get(endpoint, headers = {}) {
        return this.request({ method: "GET", endpoint, headers });
    }

    post(endpoint, data, headers = {}) {
        return this.request({ method: "POST", endpoint, data, headers });
    }

    put(endpoint, data, headers = {}) {
        return this.request({ method: "PUT", endpoint, data, headers });
    }

    delete(endpoint, data, headers = {}) {
        return this.request({ method: "DELETE", endpoint, data, headers });
    }
}

/* ======================
   SINGLETON EXPORT
   ====================== */

export const apiService = new ApiService();

/*
reasion behind using handle401 fn:
All five requests hit request().
First request:
Fetch → 401
request() sees 401
Calls handle401()
refreshPromise is null → starts refresh

Other four:
Fetch → 401
request() sees 401

Calls handle401()
refreshPromise already exists
They wait on it

Now here is the key:
Inside request() you do not throw immediately on 401.

we do:
if (response.status === 401 && retry) {
   return this.handle401(...)
}

That means:
You do NOT reach the !response.ok block
You do NOT throw the error
You do NOT log it
The 401 is handled internally.
So from your app’s perspective, those 401 responses never escaped.
They were intercepted and converted into successful replay responses.

🎯 Why You Only Saw One Unauthorized Log

Most likely:
That first 401 happened before refresh completed
Or you logged something manually during testing

But structurally:
All five 401s were intercepted.
None of them were thrown.
So you wouldn’t normally see them in your catch block.
*/