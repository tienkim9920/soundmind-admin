document.addEventListener(
    "DOMContentLoaded",
    () => {
        const form =
            document.getElementById(
                "loginForm"
            );

        const btn =
            document.getElementById(
                "loginBtn"
            );

        const errorBox =
            document.getElementById(
                "error"
            );

        form.addEventListener(
            "submit",
            async (e) => {
                e.preventDefault();

                errorBox.classList.add(
                    "d-none"
                );

                btn.disabled = true;
                btn.innerText =
                    "Đang đăng nhập...";

                const username =
                    document.getElementById(
                        "username"
                    ).value;

                const password =
                    document.getElementById(
                        "password"
                    ).value;

                try {
                    const res =
                        await fetch(
                            `${window.API_URL}/api/auth/signin`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify({
                                    username,
                                    password,
                                }),
                            }
                        );

                    const data =
                        await res.json();

                    if (
                        data.code !== 200
                    ) {
                        throw new Error(
                            data.message ||
                            "Đăng nhập thất bại"
                        );
                    }

                    // save token
                    localStorage.setItem(
                        "token",
                        data.data.token
                    );

                    document.cookie =
                        `token=${encodeURIComponent(data.data.token)}; path=/; max-age=86400; SameSite=Lax`;

                    localStorage.setItem(
                        "user",
                        JSON.stringify(
                            data.data
                        )
                    );

                    // global event
                    window.dispatchEvent(
                        new Event(
                            "auth-changed"
                        )
                    );

                    // redirect
                    window.location.href =
                        "/books";

                } catch (err) {

                    errorBox.innerText =
                        err.message ||
                        "Đăng nhập thất bại";

                    errorBox.classList.remove(
                        "d-none"
                    );

                } finally {

                    btn.disabled = false;
                    btn.innerText =
                        "Đăng nhập";
                }
            }
        );
    }
);
