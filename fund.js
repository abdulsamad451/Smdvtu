const SUPABASE_URL =
  "https://gthosvtitmymsrbynmuq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YJ8SqAQQt9Fk3QtOlHUFZg_Q0ZC2fFT";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


async function loadFundPage() {
  
  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();
  
  
  if (!session) {
    
    window.location.href =
      "login.html";
    
    return;
  }
  
  
  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .single();
  
  
  if (error) {
    
    console.error(error);
    
    return;
  }
  
  
  document.getElementById("accountName")
    .innerText =
    profile.full_name;
  
  
  /*
    IMPORTANT:
    This is intentionally not a fake account number.
    We will populate this after connecting the
    payment provider.
  */
  
  document.getElementById("accountNumber")
    .innerText =
    "Pending";
}


async function copyAccount() {
  
  const number =
    document.getElementById(
      "accountNumber"
    ).innerText;
  
  
  if (number === "Pending") {
    
    alert(
      "Your dedicated account has not been created yet."
    );
    
    return;
  }
  
  
  await navigator.clipboard.writeText(
    number
  );
  
  
  alert(
    "Account number copied."
  );
}


loadFundPage();