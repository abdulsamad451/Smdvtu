let selectedAirtimeNetwork = "MTN";
let selectedDataNetwork = "MTN";
let selectedPlan = null;

let currentBalance = 0;
let currentUser = null;


// ==========================================
// MESSAGE SYSTEM
// ==========================================

function showMessage(message, type = "info") {

  const box = document.getElementById("messageBox");

  if (!box) return;

  box.textContent = message;

  box.className = "service-message " + type;

  box.style.display = "block";
}


function clearMessage() {

  const box = document.getElementById("messageBox");

  if (!box) return;

  box.textContent = "";

  box.style.display = "none";
}


// ==========================================
// FORMAT MONEY
// ==========================================

function formatMoney(amount) {

  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

}


// ==========================================
// LOAD LOGGED-IN USER
// ==========================================

async function loadUser() {

  try {

    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();


    if (error) {

      console.error("Auth error:", error);

      showMessage(
        "Unable to check your login session.",
        "error"
      );

      return false;
    }


    if (!user) {

      showMessage(
        "Please log in before buying airtime or data.",
        "error"
      );

      return false;
    }


    currentUser = user;

    return true;

  } catch (error) {

    console.error("User loading error:", error);

    showMessage(
      "Unable to load your account.",
      "error"
    );

    return false;
  }

}


// ==========================================
// LOAD WALLET BALANCE
// ==========================================

async function loadWalletBalance() {

  try {

    if (!currentUser) {

      const loggedIn = await loadUser();

      if (!loggedIn) return;

    }


    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select("balance")
      .eq("id", currentUser.id)
      .single();


    if (error) {

      console.error("Balance error:", error);

      showMessage(
        "Unable to load your wallet balance.",
        "error"
      );

      return;
    }


    currentBalance =
      Number(profile?.balance || 0);


    const balanceElement =
      document.getElementById("walletBalance");


    if (balanceElement) {

      balanceElement.textContent =
        formatMoney(currentBalance);

    }

  } catch (error) {

    console.error("Wallet error:", error);

    showMessage(
      "Unable to load wallet balance.",
      "error"
    );

  }

}


// ==========================================
// HOME
// ==========================================

function goHome() {

  window.location.href = "index.html";

}


// ==========================================
// TABS
// ==========================================

function showAirtime() {

  document.getElementById("airtimeSection").style.display =
    "block";

  document.getElementById("dataSection").style.display =
    "none";


  document
    .getElementById("airtimeTab")
    .classList.add("active");


  document
    .getElementById("dataTab")
    .classList.remove("active");


  clearMessage();

}


function showData() {

  document.getElementById("airtimeSection").style.display =
    "none";

  document.getElementById("dataSection").style.display =
    "block";


  document
    .getElementById("dataTab")
    .classList.add("active");


  document
    .getElementById("airtimeTab")
    .classList.remove("active");


  clearMessage();

}


// ==========================================
// AIRTIME NETWORK
// ==========================================

function selectAirtimeNetwork(button) {

  document
    .querySelectorAll("#airtimeSection .network")
    .forEach(function(item) {

      item.classList.remove("active");

    });


  button.classList.add("active");


  selectedAirtimeNetwork =
    button.innerText.trim().toUpperCase();


  showMessage(
    selectedAirtimeNetwork + " selected.",
    "info"
  );

}


// ==========================================
// DATA NETWORK
// ==========================================

function selectDataNetwork(button) {

  document
    .querySelectorAll("#dataSection .network")
    .forEach(function(item) {

      item.classList.remove("active");

    });


  button.classList.add("active");


  selectedDataNetwork =
    button.innerText.trim().toUpperCase();


  showMessage(
    selectedDataNetwork + " selected.",
    "info"
  );

}


// ==========================================
// QUICK AMOUNT
// ==========================================

function setAmount(amount) {

  const input =
    document.getElementById("airtimeAmount");


  if (!input) return;


  input.value = amount;


  showMessage(
    formatMoney(amount) + " selected.",
    "info"
  );

}


// ==========================================
// PHONE VALIDATION
// ==========================================

function validNigerianPhone(phone) {

  return /^0\d{10}$/.test(phone);

}


// ==========================================
// AIRTIME PURCHASE
// ==========================================

async function continueAirtime() {

  clearMessage();


  const button =
    document.getElementById("airtimeContinue");


  const phoneInput =
    document.getElementById("airtimePhone");


  const amountInput =
    document.getElementById("airtimeAmount");


  if (!phoneInput || !amountInput) {

    showMessage(
      "Airtime form could not be found.",
      "error"
    );

    return;

  }


  const phone =
    phoneInput.value.trim();


  const amount =
    Number(amountInput.value);


  // Check phone

  if (!validNigerianPhone(phone)) {

    showMessage(
      "Please enter a valid 11-digit Nigerian phone number.",
      "error"
    );

    phoneInput.focus();

    return;

  }


  // Check amount

  if (
    !Number.isFinite(amount) ||
    amount < 50
  ) {

    showMessage(
      "Minimum airtime amount is ₦50.",
      "error"
    );

    amountInput.focus();

    return;

  }


  // Make sure user is logged in

  const loggedIn =
    await loadUser();


  if (!loggedIn) return;


  // Refresh balance before purchase

  await loadWalletBalance();


  // Check wallet

  if (currentBalance < amount) {

    showMessage(
      "Insufficient wallet balance. Your balance is " +
      formatMoney(currentBalance) +
      ".",
      "error"
    );

    return;

  }


  // Disable button

  if (button) {

    button.disabled = true;

    button.innerHTML =
      '<span>Processing...</span>' +
      '<i class="fa-solid fa-spinner fa-spin"></i>';

  }


  showMessage(
    "Processing your airtime purchase...",
    "info"
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.functions.invoke(
        "buy-airtime",
        {
          body: {

            network:
              selectedAirtimeNetwork,

            phone:
              phone,

            amount:
              amount

          }
        }
      );


    console.log(
      "buy-airtime response:",
      data
    );


    if (error) {

      console.error(
        "Edge Function error:",
        error
      );


      showMessage(
        "Unable to connect to the airtime service. Please try again.",
        "error"
      );

      return;

    }


    if (!data) {

      showMessage(
        "No response was received from the airtime service.",
        "error"
      );

      return;

    }


    // Pending

    if (data.pending) {

      showMessage(
        data.message ||
        "Your airtime transaction is pending. Please wait for confirmation.",
        "info"
      );

      return;

    }


    // Failed

    if (!data.success) {

      showMessage(
        data.message ||
        "Airtime purchase failed.",
        "error"
      );

      return;

    }


    // Successful

    if (data.success) {

      currentBalance =
        Number(
          data.newBalance ??
          (currentBalance - amount)
        );


      const balanceElement =
        document.getElementById("walletBalance");


      if (balanceElement) {

        balanceElement.textContent =
          formatMoney(currentBalance);

      }


      showMessage(
        "Airtime purchased successfully! " +
        formatMoney(amount) +
        " " +
        selectedAirtimeNetwork +
        " airtime was sent to " +
        phone +
        ".",
        "success"
      );


      phoneInput.value = "";

      amountInput.value = "";


      // Get the latest balance from Supabase

      await loadWalletBalance();

    }

  } catch (error) {

    console.error(
      "Purchase error:",
      error
    );


    showMessage(
      "Something went wrong while processing the purchase.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.innerHTML =
        '<span>Continue</span>' +
        '<i class="fa-solid fa-arrow-right"></i>';

    }

  }

}


// ==========================================
// DATA PLAN
// ==========================================

function selectPlan(button) {

  document
    .querySelectorAll("#dataSection .data-plans button")
    .forEach(function(item) {

      item.classList.remove("selected");

    });


  button.classList.add("selected");


  const name =
    button.dataset.name;


  const amount =
    Number(button.dataset.amount);


  selectedPlan = {

    name: name,

    amount: amount

  };


  showMessage(
    name +
    " selected — " +
    formatMoney(amount),
    "info"
  );

}


// ==========================================
// DATA PURCHASE
// ==========================================

function continueData() {

  clearMessage();


  const phoneInput =
    document.getElementById("dataPhone");


  if (!phoneInput) {

    showMessage(
      "Data form could not be found.",
      "error"
    );

    return;

  }


  const phone =
    phoneInput.value.trim();


  if (!validNigerianPhone(phone)) {

    showMessage(
      "Please enter a valid 11-digit Nigerian phone number.",
      "error"
    );

    phoneInput.focus();

    return;

  }


  if (!selectedPlan) {

    showMessage(
      "Please select a data plan.",
      "error"
    );

    return;

  }


  if (currentBalance < selectedPlan.amount) {

    showMessage(
      "Insufficient wallet balance. Your balance is " +
      formatMoney(currentBalance) +
      ".",
      "error"
    );

    return;

  }


  showMessage(
    "Data purchase is ready. We will connect the VTpass data service next.",
    "info"
  );

}


// ==========================================
// PAGE START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async function() {

    clearMessage();

    const loggedIn =
      await loadUser();


    if (!loggedIn) return;


    await loadWalletBalance();

  }
);