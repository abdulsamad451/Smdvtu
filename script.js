let balanceVisible = true;
let currentBalance = 0;


// ===============================
// LOAD USER DATA
// ===============================

async function loadUserData() {

  try {

    const {
      data: { user },
      error: authError
    } = await supabaseClient.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);
      return;
    }

    // ===============================
    // NO USER
    // ===============================

    if (!user) {

      const userName =
        document.getElementById("userName");

      if (userName) {
        userName.innerText = "Not logged in";
      }

      return;
    }


    // ===============================
    // GET PROFILE
    // ===============================

    const {
      data: profile,
      error: profileError
    } = await supabaseClient

      .from("profiles")

      .select("*")

      .eq("id", user.id)

      .single();


    if (profileError) {

      console.error(
        "Profile error:",
        profileError
      );

      const userName =
        document.getElementById("userName");

      if (userName) {
        userName.innerText =
          "Profile error";
      }

      return;
    }


    // ===============================
    // NAME
    // ===============================

    const userName =
      document.getElementById("userName");

    if (userName) {

      userName.innerText =
        profile.full_name || "User";

    }


    // ===============================
    // BALANCE
    // ===============================

    currentBalance =
      Number(profile.balance || 0);


    const balance =
      document.getElementById("balance");


    if (balance) {

      balance.innerText =
        "₦" +
        currentBalance.toLocaleString(
          "en-NG",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }
        );

    }


    // ===============================
    // TRANSACTIONS
    // ===============================

    await loadTransactions(user.id);


  } catch (error) {

    console.error(
      "Unexpected loadUserData error:",
      error
    );

  }

}


// ========================================
// LOAD LATEST 3 TRANSACTIONS
// ========================================

async function loadTransactions(userId) {

  const list =
    document.getElementById(
      "transactionsList"
    );


  if (!list) {

    console.error(
      "transactionsList element not found"
    );

    return;

  }


  // ===============================
  // SHOW LOADING
  // ===============================

  list.innerHTML = `

    <div class="transaction loading-transaction">

      <div class="transaction-icon">

        <i class="fa-solid fa-spinner fa-spin"></i>

      </div>

      <div class="transaction-info">

        <h3>Loading transactions</h3>

        <p>Please wait...</p>

      </div>

    </div>

  `;


  try {

    // ===============================
    // GET LATEST 3 TRANSACTIONS
    // ===============================

    const {
      data,
      error
    } = await supabaseClient

      .from("transactions")

      .select("*")

      .eq(
        "user_id",
        userId
      )

      .order(
        "created_at",
        {
          ascending: false
        }
      )

      .limit(3);


    // ===============================
    // ERROR
    // ===============================

    if (error) {

      console.error(
        "Dashboard transaction error:",
        error
      );


      list.innerHTML = `

        <div class="transaction">

          <div class="transaction-icon">

            <i class="fa-solid fa-circle-exclamation"></i>

          </div>

          <div class="transaction-info">

            <h3>Unable to load</h3>

            <p>
              ${escapeHTML(
                error.message ||
                "Transaction error"
              )}
            </p>

          </div>

        </div>

      `;

      return;

    }


    // ===============================
    // NO TRANSACTIONS
    // ===============================

    if (
      !data ||
      data.length === 0
    ) {

      list.innerHTML = `

        <div class="transaction">

          <div class="transaction-icon">

            <i class="fa-solid fa-receipt"></i>

          </div>

          <div class="transaction-info">

            <h3>No transactions yet</h3>

            <p>
              Your transactions will appear here
            </p>

          </div>

        </div>

      `;

      return;

    }


    // ===============================
    // CLEAR LOADING
    // ===============================

    list.innerHTML = "";


    // ===============================
    // DISPLAY TRANSACTIONS
    // ===============================

    data.forEach(
      transaction => {

        const amount =
          Number(
            transaction.amount || 0
          );


        // ===============================
        // DATE
        // ===============================

        const date =
          transaction.created_at

            ? new Date(
                transaction.created_at
              ).toLocaleDateString(
                "en-NG",
                {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                }
              )

            : "Unknown date";


        // ===============================
        // TITLE
        // ===============================

        const title =

          transaction.title ||

          transaction.service ||

          transaction.type ||

          transaction.description ||

          "Transaction";


        // ===============================
        // STATUS
        // ===============================

        const status =
          transaction.status ||
          "Success";


        const statusText =
          String(status)
            .toLowerCase();


        let statusClass =
          "status-success";


        // ===============================
        // PENDING
        // ===============================

        if (
          statusText.includes(
            "pending"
          ) ||

          statusText.includes(
            "processing"
          )
        ) {

          statusClass =
            "status-pending";

        }


        // ===============================
        // SUCCESS
        // ===============================

        else if (
          statusText.includes(
            "success"
          ) ||

          statusText.includes(
            "completed"
          ) ||

          statusText.includes(
            "complete"
          )
        ) {

          statusClass =
            "status-success";

        }


        // ===============================
        // FAILED
        // ===============================

        else if (
          statusText.includes(
            "failed"
          ) ||

          statusText.includes(
            "fail"
          ) ||

          statusText.includes(
            "cancelled"
          ) ||

          statusText.includes(
            "canceled"
          )
        ) {

          statusClass =
            "status-failed";

        }


        // ===============================
        // CREATE TRANSACTION
        // ===============================

        const div =
          document.createElement(
            "div"
          );


        div.className =
          "transaction";


        div.innerHTML = `

          <div class="transaction-icon">

            <i class="fa-solid fa-arrow-down"></i>

          </div>


          <div class="transaction-info">

            <h3>
              ${escapeHTML(title)}
            </h3>

            <p>
              ${escapeHTML(date)}
            </p>

          </div>


          <div class="transaction-right">

            <strong>
              ₦${amount.toLocaleString(
                "en-NG"
              )}
            </strong>


            <small class="${statusClass}">

              ${escapeHTML(status)}

            </small>

          </div>

        `;


        list.appendChild(
          div
        );

      }
    );


  } catch (error) {

    console.error(
      "Unexpected dashboard transaction error:",
      error
    );


    list.innerHTML = `

      <div class="transaction">

        <div class="transaction-icon">

          <i class="fa-solid fa-circle-exclamation"></i>

        </div>

        <div class="transaction-info">

          <h3>Unable to load</h3>

          <p>
            ${escapeHTML(
              error.message ||
              "Something went wrong"
            )}
          </p>

        </div>

      </div>

    `;

  }

}


// ===============================
// BALANCE VISIBILITY
// ===============================

function toggleBalance() {

  const balance =
    document.getElementById(
      "balance"
    );


  const eye =
    document.querySelector(
      "#balanceEye i"
    );


  if (!balance) {
    return;
  }


  if (balanceVisible) {

    balance.innerText =
      "₦••••••";


    if (eye) {

      eye.className =
        "fa-regular fa-eye-slash";

    }


    balanceVisible =
      false;

  }

  else {

    balance.innerText =
      "₦" +
      currentBalance.toLocaleString(
        "en-NG",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );


    if (eye) {

      eye.className =
        "fa-regular fa-eye";

    }


    balanceVisible =
      true;

  }

}


// ===============================
// COPY ACCOUNT NUMBER
// ===============================

function copyAccountNumber() {

  const accountElement =
    document.getElementById(
      "accountNumber"
    );


  if (!accountElement) {

    alert(
      "Account number is not available on this page."
    );

    return;

  }


  const account =
    accountElement.innerText;


  if (
    !account ||
    account === "Loading..." ||
    account === "No account number"
  ) {

    alert(
      "No account number available."
    );

    return;

  }


  navigator.clipboard
    .writeText(account)

    .then(() => {

      alert(
        "Account number copied!"
      );

    })

    .catch(() => {

      alert(
        "Could not copy account number."
      );

    });

}


// ===============================
// ADD MONEY
// ===============================

async function addMoney() {

  alert(
    "ADD MONEY BUTTON IS WORKING"
  );


  const amountText =
    prompt(
      "Enter amount to fund your wallet:"
    );


  if (!amountText) {
    return;
  }


  const amount =
    Number(amountText);


  if (
    !Number.isFinite(amount) ||
    amount < 100
  ) {

    alert(
      "Enter a valid amount of at least ₦100."
    );

    return;

  }


  if (amount > 1000000) {

    alert(
      "Maximum funding amount is ₦1,000,000."
    );

    return;

  }


  try {

    const {
      data: { session },
      error: sessionError
    } =
      await supabaseClient
        .auth
        .getSession();


    if (
      sessionError ||
      !session
    ) {

      alert(
        "Please log in again."
      );

      return;

    }


    const {
      data,
      error
    } =
      await supabaseClient
        .functions
        .invoke(
          "create-wallet-invoice",
          {
            body: {
              amount: amount
            }
          }
        );


    if (error) {

      console.error(
        error
      );

      alert(
        "Unable to create payment."
      );

      return;

    }


    if (
      !data ||
      !data.success
    ) {

      alert(
        data?.message ||
        "Unable to create payment."
      );

      return;

    }


    if (
      !data.checkoutUrl
    ) {

      alert(
        "Payment link was not returned."
      );

      return;

    }


    window.location.href =
      data.checkoutUrl;


  } catch (error) {

    console.error(
      error
    );

    alert(
      "Something went wrong. Please try again."
    );

  }

}


// ===============================
// EARN
// ===============================

function earn() {

  alert(
    "Referral & Earn page coming next."
  );

}


// ===============================
// SERVICES
// ===============================

function openService(service) {

  if (
    service === "Airtime" ||
    service === "Internet"
  ) {

    window.location.href =
      "services.html";

    return;

  }


  alert(
    service +
    " service coming next."
  );

}


// ===============================
// MORE
// ===============================

function showMore() {

  alert(
    "More services coming next."
  );

}


// ===============================
// TRANSACTIONS
// ===============================

function viewTransactions() {

  alert(
    "Transactions page coming next."
  );

}


// ===============================
// NAVIGATION
// ===============================

function navigate(
  page,
  button
) {

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      item => {

        item.classList.remove(
          "active"
        );

      }
    );


  if (button) {

    button.classList.add(
      "active"
    );

  }


  if (
    page !== "home"
  ) {

    alert(
      page.charAt(0).toUpperCase() +
      page.slice(1) +
      " page coming next."
    );

  }

}


// ===============================
// GO TO MORE
// ===============================

function goToMore() {

  const loader =
    document.getElementById(
      "pageLoader"
    );


  document
    .querySelectorAll(
      "button"
    )
    .forEach(
      button => {

        button.disabled =
          true;

      }
    );


  if (loader) {

    loader.classList.add(
      "show"
    );

  }


  setTimeout(
    () => {

      window.location.href =
        "more.html";

    },
    500
  );

}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ===============================
// START APP
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  async () => {
    
    await loadUserData();
    
    await loadNotifications();
    
    startNotificationRealtime();
    
  }
);

// ==========================================
// LIVE NOTIFICATIONS
// ==========================================

let notificationChannel =
  null;


// ==========================================
// LOAD NOTIFICATIONS
// ==========================================

async function loadNotifications() {

  const list =
    document.getElementById(
      "notificationsList"
    );


  const badge =
    document.getElementById(
      "notificationBadge"
    );


  const countText =
    document.getElementById(
      "notificationCountText"
    );


  if (!list) {
    return;
  }


  list.innerHTML = `

    <div class="notification-loading">

      <i class="fa-solid fa-spinner fa-spin"></i>

      <p>
        Loading notifications...
      </p>

    </div>

  `;


  try {

    const {
      data: { user },
      error: userError
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      userError ||
      !user
    ) {

      console.error(
        "User error:",
        userError
      );


      list.innerHTML = `

        <div class="notification-empty">

          <i class="fa-regular fa-bell-slash"></i>

          <h3>
            Please log in
          </h3>

          <p>
            Your notifications will appear here.
          </p>

        </div>

      `;


      if (badge) {

        badge.style.display =
          "none";

      }


      return;

    }


    console.log(
      "Notification user:",
      user.id
    );


    const {
      data: notifications,
      error
    } =
      await supabaseClient

        .from("notifications")

        .select(
          "id, user_id, title, message, is_read, created_at"
        )

        .eq(
          "user_id",
          user.id
        )

        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        "Notification fetch error:",
        error
      );


      list.innerHTML = `

        <div class="notification-empty">

          <i class="fa-solid fa-triangle-exclamation"></i>

          <h3>
            Unable to load
          </h3>

          <p>
            ${escapeHTML(
              error.message
            )}
          </p>

        </div>

      `;

      return;

    }


    console.log(
      "Notifications found:",
      notifications
    );


    const unreadCount =
      notifications.filter(
        notification =>
          notification.is_read === false
      ).length;


    // ===============================
    // BADGE
    // ===============================

    if (badge) {

      if (
        unreadCount > 0
      ) {

        badge.innerText =
          unreadCount > 99
            ? "99+"
            : unreadCount;


        badge.style.display =
          "flex";

      }

      else {

        badge.innerText =
          "0";


        badge.style.display =
          "none";

      }

    }


    // ===============================
    // COUNT TEXT
    // ===============================

    if (countText) {

      if (
        unreadCount === 0
      ) {

        countText.innerText =
          "You're all caught up";

      }

      else {

        countText.innerText =
          unreadCount +
          (
            unreadCount === 1
              ? " unread notification"
              : " unread notifications"
          );

      }

    }


    // ===============================
    // NO NOTIFICATIONS
    // ===============================

    if (
      !notifications.length
    ) {

      list.innerHTML = `

        <div class="notification-empty">

          <i class="fa-regular fa-bell-slash"></i>

          <h3>
            No notifications
          </h3>

          <p>
            You're all caught up.
          </p>

        </div>

      `;

      return;

    }


    // ===============================
    // RENDER NOTIFICATIONS
    // ===============================

    list.innerHTML =
      notifications
        .map(
          notification => {

            const unread =
              notification.is_read === false;


            const title =
              escapeHTML(
                notification.title ||
                "Notification"
              );


            const message =
              escapeHTML(
                notification.message ||
                ""
              );


            const date =
              notification.created_at

                ? new Date(
                    notification.created_at
                  ).toLocaleString()

                : "";


            return `

              <div
                class="notification-item
                ${unread ? "unread" : ""}"
                data-id="${escapeHTML(
                  notification.id
                )}"
              >

                <div class="notification-icon">

                  <i class="fa-solid fa-bell"></i>

                </div>


                <div class="notification-content">

                  <div class="notification-title">

                    ${title}

                    ${
                      unread
                        ? `
                          <span
                            class="notification-unread-dot">
                          </span>
                        `
                        : ""
                    }

                  </div>


                  <p>
                    ${message}
                  </p>


                  <small>
                    ${escapeHTML(date)}
                  </small>

                </div>

              </div>

            `;

          }
        )
        .join("");


  }

  catch (error) {

    console.error(
      "Notification error:",
      error
    );


    list.innerHTML = `

      <div class="notification-empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <h3>
          Something went wrong
        </h3>

        <p>
          Unable to load notifications.
        </p>

      </div>

    `;

  }

}


// ===============================
// NOTIFICATION PANEL
// ===============================

function toggleNotificationPanel() {

  const overlay =
    document.getElementById(
      "notificationOverlay"
    );


  if (!overlay) {
    return;
  }


  const isOpen =
    overlay.classList.contains(
      "show"
    );


  if (isOpen) {

    closeNotifications();

  }

  else {

    overlay.classList.add(
      "show"
    );

    loadNotifications();

  }

}


// ===============================
// CLOSE NOTIFICATIONS
// ===============================

function closeNotifications() {

  const overlay =
    document.getElementById(
      "notificationOverlay"
    );


  if (!overlay) {
    return;
  }


  overlay.classList.remove(
    "show"
  );

}


// ===============================
// CLOSE OUTSIDE
// ===============================

function closeNotificationsOutside(
  event
) {

  if (
    event.target &&
    event.target.id ===
      "notificationOverlay"
  ) {

    closeNotifications();

  }

}


// ===============================
// MARK ALL AS READ
// ===============================

async function markAllNotificationsRead() {

  try {

    const {
      data: { user },
      error: authError
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      authError ||
      !user
    ) {

      console.error(
        "Authentication error:",
        authError
      );

      return;

    }


    const {
      error
    } =
      await supabaseClient

        .from("notifications")

        .update({
          is_read: true
        })

        .eq(
          "user_id",
          user.id
        )

        .eq(
          "is_read",
          false
        );


    if (error) {

      console.error(
        "Mark all as read error:",
        error
      );

      return;

    }


    await loadNotifications();


    document
      .querySelectorAll(
        ".notification-item.unread"
      )
      .forEach(
        item => {

          item.classList.remove(
            "unread"
          );

        }
      );


  }

  catch (error) {

    console.error(
      "Mark all as read error:",
      error
    );

  }

}


// ==========================================
// LIVE NOTIFICATION LISTENER
// ==========================================

async function startNotificationRealtime() {

  try {

    const {
      data: { user },
      error
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      error ||
      !user
    ) {

      console.log(
        "No logged-in user for notifications."
      );

      return;

    }


    // ===============================
    // REMOVE OLD CHANNEL
    // ===============================

    if (
      notificationChannel
    ) {

      await supabaseClient
        .removeChannel(
          notificationChannel
        );


      notificationChannel =
        null;

    }


    // ===============================
    // CREATE CHANNEL
    // ===============================

    notificationChannel =

      supabaseClient

        .channel(
          "user-notifications-" +
          user.id
        )

        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter:
              "user_id=eq." +
              user.id
          },

          async (
            payload
          ) => {

            console.log(
              "🔔 New notification received:",
              payload.new
            );


            await loadNotifications();


            if (
              navigator.vibrate
            ) {

              navigator.vibrate(
                150
              );

            }

          }
        )

        .subscribe(
          status => {

            console.log(
              "Notification realtime status:",
              status
            );

          }
        );

  }

  catch (error) {

    console.error(
      "Realtime notification error:",
      error
    );

  }

}


