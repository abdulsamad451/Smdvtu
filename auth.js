const SUPABASE_URL =
  "https://gthosvtitmymsrbynmuq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YJ8SqAQQt9Fk3QtOlHUFZg_Q0ZC2fFT";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );



/* ================================
   REGISTER
================================ */

const registerForm =
  document.getElementById("registerForm");


if (registerForm) {
  
  registerForm.addEventListener(
    "submit",
    async function(event) {
      
      event.preventDefault();
      
      
      const fullName =
        document.getElementById("fullName").value.trim();
      
      const phone =
        document.getElementById("phone").value.trim();
      
      const email =
        document.getElementById("email").value.trim();
      
      const password =
        document.getElementById("password").value;
      
      
      const message =
        document.getElementById("registerMessage");
      
      
      if (phone.length !== 11) {
        
        showMessage(
          message,
          "Please enter a valid 11-digit Nigerian phone number."
        );
        
        return;
      }
      
      
      if (password.length < 6) {
        
        showMessage(
          message,
          "Password must contain at least 6 characters."
        );
        
        return;
      }
      
      
      showMessage(
        message,
        "Creating your account...",
        false
      );
      
      
      const {
  data,
  error
} = await supabaseClient.auth.signUp({
  email: email,
  password: password,

  options: {
    emailRedirectTo:
      window.location.origin + "/confirm-email.html",

    data: {
      full_name: fullName,
      phone: phone
    }
  }
});
      
      
      if (error) {
        
        showMessage(
          message,
          error.message
        );
        
        return;
      }
      
      
      message.className =
        "message success";
      
      message.style.display =
        "block";
      
      message.innerText =
        "Account created successfully! Check your email to confirm your account.";
      
    }
  );
  
}



/* ================================
   LOGIN
================================ */

const loginForm =
  document.getElementById("loginForm");


if (loginForm) {
  
  loginForm.addEventListener(
    "submit",
    async function(event) {
      
      event.preventDefault();
      
      
      const email =
        document.getElementById("loginEmail").value.trim();
      
      
      const password =
        document.getElementById("loginPassword").value;
      
      
      const message =
        document.getElementById("loginMessage");
      
      
      showMessage(
        message,
        "Logging in...",
        false
      );
      
      
      const {
        data,
        error
      } =
      await supabaseClient.auth.signInWithPassword({
        
        email: email,
        
        password: password
        
      });
      
      
      if (error) {
        
        showMessage(
          message,
          error.message
        );
        
        return;
        
      }
      
      
      /*
        Remember the account locally.

        We DO NOT save the password.
      */
      
      localStorage.setItem(
        "myvtu_biometric_email",
        email
      );
      
      
      window.location.href =
        "dashboard.html";
      
    }
  );
  
}
/* ================================
   BIOMETRIC LOGIN
================================ */

function biometricEnabled() {

  return (
    localStorage.getItem(
      "myvtu_biometrics"
    ) === "true"
  );

}


/* ================================
   SHOW / HIDE BIOMETRIC BUTTON
================================ */

function updateBiometricLoginUI() {

  const box =
    document.getElementById(
      "biometricLoginBox"
    );


  if (!box) return;


  const enabled =
    biometricEnabled();


  /*
    Only show the button if the user
    enabled biometrics in Profile.
  */

  if (enabled) {

    box.style.display =
      "block";

  } else {

    box.style.display =
      "none";

  }

}


/* ================================
   DEVICE BIOMETRIC CHECK
================================ */

async function authenticateBiometric() {

  /*
    WebAuthn requires HTTPS.
  */

  if (
    !window.PublicKeyCredential ||
    !navigator.credentials
  ) {

    throw new Error(
      "Biometric authentication is not supported on this device."
    );

  }


  /*
    Check whether the device/browser
    has a platform authenticator.

    This can include Face ID,
    Touch ID or fingerprint.
  */

  if (
    PublicKeyCredential
      .isUserVerifyingPlatformAuthenticatorAvailable
  ) {

    const available =
      await PublicKeyCredential
        .isUserVerifyingPlatformAuthenticatorAvailable();


    if (!available) {

      throw new Error(
        "Face ID or fingerprint is not available."
      );

    }

  }


  /*
    IMPORTANT:

    Without a server-side WebAuthn
    challenge we cannot use this as
    a complete replacement for
    Supabase authentication.

    Therefore this function is only
    a local biometric confirmation.
  */

  const challenge =
    crypto.getRandomValues(
      new Uint8Array(32)
    );


  const credential =
    await navigator.credentials.create({

      publicKey: {

        challenge: challenge,

        rp: {
          name: "MyVTU"
        },

        user: {

          id:
            new TextEncoder().encode(
              "myvtu-local-user"
            ),

          name:
            "MyVTU User",

          displayName:
            "MyVTU User"

        },

        pubKeyCredParams: [

          {
            type: "public-key",
            alg: -7
          },

          {
            type: "public-key",
            alg: -257
          }

        ],

        authenticatorSelection: {

          authenticatorAttachment:
            "platform",

          userVerification:
            "required"

        },

        timeout:
          60000,

        attestation:
          "none"

      }

    });


  if (!credential) {

    throw new Error(
      "Biometric verification was cancelled."
    );

  }


  return true;

}


/* ================================
   LOGIN WITH BIOMETRICS
================================ */

async function loginWithBiometrics() {

  const button =
    document.getElementById(
      "biometricLoginButton"
    );


  const message =
    document.getElementById(
      "loginMessage"
    );


  if (!biometricEnabled()) {

    showMessage(
      message,
      "Biometrics are not enabled."
    );

    return;

  }


  const savedEmail =
    localStorage.getItem(
      "myvtu_biometric_email"
    );


  if (!savedEmail) {

    showMessage(
      message,
      "Please login with your email and password first."
    );

    return;

  }


  try {

    if (button) {

      button.classList.add(
        "loading"
      );

      button.innerHTML = `
        <i class="fa-solid fa-fingerprint"></i>
        <span>Verifying...</span>
      `;

    }


    await authenticateBiometric();


    /*
      IMPORTANT:

      At this point the device has
      successfully verified the user.

      But we still need a valid
      Supabase session.

      We therefore check whether
      Supabase already has an active
      session.
    */

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (
      error ||
      !data.session
    ) {

      showMessage(
        message,
        "Please login with your email and password first."
      );

      return;

    }


    window.location.href =
      "dashboard.html";


  } catch (error) {

    console.error(
      "Biometric error:",
      error
    );


    showMessage(
      message,
      error.message ||
      "Biometric verification failed."
    );


  } finally {

    if (button) {

      button.classList.remove(
        "loading"
      );

      button.innerHTML = `
        <i class="fa-solid fa-fingerprint"></i>
        <span>Login with Biometrics</span>
      `;

    }

  }

}



/* ================================
   PASSWORD VISIBILITY
================================ */

function togglePassword(
  inputId,
  button
) {
  
  const input =
    document.getElementById(inputId);
  
  
  if (input.type === "password") {
    
    input.type = "text";
    
    button.innerHTML =
      '<i class="fa-regular fa-eye-slash"></i>';
    
  } else {
    
    input.type = "password";
    
    button.innerHTML =
      '<i class="fa-regular fa-eye"></i>';
    
  }
  
}



/* ================================
   MESSAGE
================================ */

function showMessage(
  element,
  text,
  error = true
) {
  
  element.style.display =
    "block";
  
  element.innerText =
    text;
  
  if (error) {
    
    element.className =
      "message";
    
  } else {
    
    element.className =
      "message success";
    
  }
  
}
/* ================================
   START LOGIN PAGE
================================ */

document.addEventListener(
  "DOMContentLoaded",
  function() {
    
    updateBiometricLoginUI();
    
  }
);