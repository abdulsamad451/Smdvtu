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

    if (!user) {
      document.getElementById("userName").innerText = "Not logged in";
      document.getElementById("accountNumber").innerText = "Login required";
      return;
    }


    // Get profile
    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();


    if (profileError) {

      console.error("Profile error:", profileError);

      document.getElementById("userName").innerText = "Profile error";

      return;
    }


    // ===============================
    // NAME
    // ===============================

    document.getElementById("userName").innerText =
      profile.full_name || "User";


    // ===============================
    // BALANCE
    // ===============================

    currentBalance = Number(profile.balance || 0);

    document.getElementById("balance").innerText =
      "₦" + currentBalance.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });


    // ===============================
    // ACCOUNT NUMBER
    // ===============================

    if (profile.phone) {

      let phone = String(profile.phone)
        .replace(/\D/g, "");

      // Show last 10 digits
      if (phone.length >= 10) {
        phone = phone.slice(-10);
      }

      document.getElementById("accountNumber").innerText = phone;

    } else {

      document.getElementById("accountNumber").innerText =
        "No account number";

    }


    // ===============================
    // TRANSACTIONS
    // ===============================

    await loadTransactions(user.id);

  } catch (error) {

    console.error("Unexpected error:", error);

  }

}


// ===============================
// LOAD TRANSACTIONS
// ===============================

async function loadTransactions(userId) {

  const list = document.getElementById("transactionsList");

  const { data, error } = await supabaseClient
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);


  if (error) {

    console.error("Transaction error:", error);

    list.innerHTML = `
      <div class="transaction">
        <div class="transaction-icon">
          <i class="fa-solid fa-circle-exclamation"></i>
        </div>

        <div class="transaction-info">
          <h3>Unable to load</h3>
          <p>Try again later</p>
        </div>
      </div>
    `;

    return;
  }


  if (!data || data.length === 0) {

    list.innerHTML = `
      <div class="transaction">
        <div class="transaction-icon">
          <i class="fa-solid fa-receipt"></i>
        </div>

        <div class="transaction-info">
          <h3>No transactions yet</h3>
          <p>Your transactions will appear here</p>
        </div>
      </div>
    `;

    return;
  }


  list.innerHTML = "";


  data.forEach(transaction => {

    const amount = Number(transaction.amount || 0);

    const date = new Date(transaction.created_at);

    const formattedDate = date.toLocaleDateString("en-NG", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric"
    });


    const div = document.createElement("div");

    div.className = "transaction";


    div.innerHTML = `

      <div class="transaction-icon">

        <i class="fa-solid fa-arrow-down"></i>

      </div>


      <div class="transaction-info">

        <h3>
          ${transaction.description || transaction.type || "Transaction"}
        </h3>

        <p>
          ${formattedDate}
        </p>

      </div>


      <div class="transaction-right">

        <strong>
          ₦${amount.toLocaleString("en-NG")}
        </strong>

        <small>
          ${transaction.status || "Success"}
        </small>

      </div>

    `;


    list.appendChild(div);

  });

}


// ===============================
// BALANCE VISIBILITY
// ===============================

function toggleBalance() {

  const balance = document.getElementById("balance");
  const eye = document.querySelector("#balanceEye i");

  if (balanceVisible) {

    balance.innerText = "₦••••••";

    eye.className = "fa-regular fa-eye-slash";

    balanceVisible = false;

  } else {

    balance.innerText =
      "₦" + currentBalance.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

    eye.className = "fa-regular fa-eye";

    balanceVisible = true;

  }

}


// ===============================
// COPY ACCOUNT NUMBER
// ===============================

function copyAccountNumber() {

  const account =
    document.getElementById("accountNumber").innerText;

  if (
    !account ||
    account === "Loading..." ||
    account === "No account number"
  ) {
    alert("No account number available.");
    return;
  }


  navigator.clipboard.writeText(account)
    .then(() => {
      alert("Account number copied!");
    })
    .catch(() => {
      alert("Could not copy account number.");
    });

}


// ===============================
// ADD MONEY
// ===============================

async function addMoney() {
  alert("ADD MONEY BUTTON IS WORKING");
  
  const amountText = prompt("Enter amount to fund your wallet:");
  
  if (!amountText) return;
  
  const amount = Number(amountText);
  
  if (!Number.isFinite(amount) || amount < 100) {
    alert("Enter a valid amount of at least ₦100.");
    return;
  }
  
  if (amount > 1000000) {
    alert("Maximum funding amount is ₦1,000,000.");
    return;
  }
  
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();
    
    if (sessionError || !session) {
      alert("Please log in again.");
      return;
    }
    
    const { data, error } =
    await supabaseClient.functions.invoke(
      "create-wallet-invoice",
      {
        body: {
          amount: amount
        }
      }
    );
    
    if (error) {
      console.error(error);
      alert("Unable to create payment.");
      return;
    }
    
    if (!data || !data.success) {
      alert(
        data?.message ||
        "Unable to create payment."
      );
      return;
    }
    
    if (!data.checkoutUrl) {
      alert("Payment link was not returned.");
      return;
    }
    
    // Open Monnify checkout
    window.location.href = data.checkoutUrl;
    
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Please try again.");
  }
}
// ===============================
// EARN
// ===============================

function earn() {

  alert("Referral & Earn page coming next.");

}


// ===============================
// SERVICES
// ===============================

function openService(service) {

  if (
    service === "Airtime" ||
    service === "Internet"
  ) {

    window.location.href = "services.html";

    return;
  }


  alert(service + " service coming next.");

}


// ===============================
// MORE
// ===============================

function showMore() {

  alert("More services coming next.");

}


// ===============================
// TRANSACTIONS
// ===============================

function viewTransactions() {

  alert("Transactions page coming next.");

}


// ===============================
// NAVIGATION
// ===============================

function navigate(page, button) {

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {
      item.classList.remove("active");
    });


  if (button) {
    button.classList.add("active");
  }


  if (page !== "home") {

    alert(
      page.charAt(0).toUpperCase() +
      page.slice(1) +
      " page coming next."
    );

  }

}
function goToMore() {
  
  const loader =
    document.getElementById("pageLoader");
  
  document
    .querySelectorAll("button")
    .forEach(button => {
      button.disabled = true;
    });
  
  if (loader) {
    loader.classList.add("show");
  }
  
  setTimeout(() => {
    
    window.location.href =
      "more.html";
    
  }, 500);
  
}


// ===============================
// START APP
// ===============================

document.addEventListener("DOMContentLoaded", () => {

  loadUserData();

});