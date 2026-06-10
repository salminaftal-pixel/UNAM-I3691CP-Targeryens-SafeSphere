import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseAuth, firestore, isFirebaseConfigured } from './firebase';
import { FIRESTORE_COLLECTIONS } from './firestoreCollections';

const USERNAME_PATTERN = /^[a-z0-9._-]{3,24}$/;

export function normalize(value = '') {
  return String(value).trim().toLowerCase();
}

function initialsFrom(fullName, username) {
  const source = fullName?.trim() || username?.trim() || 'User';
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function toClientUser(profile) {
  return {
    uid: profile.uid,
    fullName: profile.fullName,
    username: profile.username,
    email: profile.email,
    initials: profile.initials || initialsFrom(profile.fullName, profile.username),
    photoURL: profile.photoURL || '',
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getUserProfileWithRetry(uid, attempts = 5) {
  const profileRef = doc(firestore, FIRESTORE_COLLECTIONS.users, uid);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists() || attempt === attempts) {
      return profileSnap;
    }

    await wait(300);
  }

  return getDoc(profileRef);
}

function validateRegistrationAccount(account, username, email) {
  const fullName = account.fullName?.trim() || '';

  if (fullName.length < 2 || fullName.length > 80) {
    return 'Full name must be between 2 and 80 characters.';
  }

  if (!USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-24 characters using lowercase letters, numbers, dots, underscores, or hyphens.';
  }

  if (!email) {
    return 'Please enter a valid email address.';
  }

  if (!account.password || account.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return '';
}

function buildRegistrationProfile(account, user, username, email) {
  const userEmail = user.email || email;

  return {
    uid: user.uid,
    fullName: account.fullName.trim(),
    username,
    email: userEmail,
    initials: account.initials || initialsFrom(account.fullName, username),
    photoURL: account.photoURL || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function completeProfileSetup(user, account, username, email, options = {}) {
  await user.getIdToken(true);

  const uid = user.uid;
  const userEmail = user.email || email;
  const userRef = doc(firestore, FIRESTORE_COLLECTIONS.users, uid);
  const usernameRef = doc(firestore, FIRESTORE_COLLECTIONS.usernameIndex, username);
  const profile = buildRegistrationProfile(account, user, username, email);
  let existingProfile = null;

  await updateProfile(user, {
    displayName: profile.fullName,
    photoURL: profile.photoURL || undefined,
  });

  await runTransaction(firestore, async (transaction) => {
    const freshUsername = await transaction.get(usernameRef);
    const freshProfile = await transaction.get(userRef);

    if (freshUsername.exists() && freshUsername.data().uid !== uid) {
      throw new Error('username-taken');
    }

    if (freshProfile.exists()) {
      existingProfile = freshProfile.data();
      if (!options.allowExistingProfile) {
        throw new Error('profile-exists');
      }
      if (existingProfile.username !== username) {
        throw new Error('profile-exists');
      }
    } else {
      transaction.set(userRef, profile);
    }

    if (!freshUsername.exists()) {
      transaction.set(usernameRef, { uid, username, email: userEmail, createdAt: serverTimestamp() });
    }
  });

  return existingProfile || profile;
}

async function signInAndCompleteProfileSetup(account, username, email) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, account.password);
  const profile = await completeProfileSetup(credential.user, account, username, email, {
    allowExistingProfile: true,
  });

  return { ok: true, user: toClientUser(profile) };
}

export async function registerFirebaseAccount(account) {
  if (!isFirebaseConfigured) {
    return { ok: false, message: 'Firebase is not configured.' };
  }

  const username = normalize(account.username);
  const email = normalize(account.email);
  const validationMessage = validateRegistrationAccount(account, username, email);

  if (validationMessage) {
    return { ok: false, message: validationMessage };
  }

  const usernameRef = doc(firestore, FIRESTORE_COLLECTIONS.usernameIndex, username);
  let createdUser = null;

  try {
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      const indexedEmail = normalize(usernameSnap.data().email);
      if (indexedEmail !== email) {
        return { ok: false, message: 'That username is already registered.' };
      }

      return await signInAndCompleteProfileSetup(account, username, email);
    }

    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, account.password);
    createdUser = credential.user;
    const profile = await completeProfileSetup(credential.user, account, username, email);

    return { ok: true, user: toClientUser(profile) };
  } catch (error) {
    console.error('[reg] Registration error:', error.code, error.message);
    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (cleanupError) {
        console.warn('[reg] Could not remove incomplete auth account:', cleanupError.message || cleanupError);
      }
    }

    if (error.message === 'username-taken') {
      return { ok: false, message: 'That username is already registered.' };
    }
    if (error.message === 'profile-exists') {
      return { ok: false, message: 'That email is already registered. Sign in instead.' };
    }
    if (error.code === 'auth/invalid-credential') {
      return { ok: false, message: 'That username or email is already registered. Sign in instead.' };
    }
    if (error.code === 'auth/email-already-in-use') {
      try {
        return await signInAndCompleteProfileSetup(account, username, email);
      } catch (repairError) {
        if (repairError.code === 'auth/invalid-credential') {
          return { ok: false, message: 'That email is already registered. Sign in instead.' };
        }
        if (repairError.message === 'username-taken') {
          return { ok: false, message: 'That username is already registered.' };
        }
        if (repairError.message === 'profile-exists') {
          return { ok: false, message: 'That email is already registered. Sign in instead.' };
        }
        if (repairError.code === 'permission-denied') {
          return {
            ok: false,
            message: 'Firestore denied profile setup. Firestore rules must be deployed.',
          };
        }
        return { ok: false, message: repairError.message || 'Could not finish profile setup.' };
      }
    }
    if (error.code === 'permission-denied') {
      return {
        ok: false,
        message: 'Firestore denied profile setup. Firestore rules must be deployed.',
      };
    }
    return { ok: false, message: error.message || 'Could not create your account.' };
  }
}

export async function loginFirebaseAccount({ identifier, password }) {
  if (!isFirebaseConfigured) {
    return { ok: false, message: 'Firebase is not configured.' };
  }

  try {
    const normalizedIdentifier = normalize(identifier);
    let email = normalizedIdentifier;

    if (!normalizedIdentifier.includes('@')) {
      const usernameSnap = await getDoc(doc(firestore, FIRESTORE_COLLECTIONS.usernameIndex, normalizedIdentifier));
      if (!usernameSnap.exists()) {
        return { ok: false, message: 'No account matches that username.' };
      }
      email = usernameSnap.data().email;
    }

    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const profileSnap = await getDoc(doc(firestore, FIRESTORE_COLLECTIONS.users, credential.user.uid));

    if (!profileSnap.exists()) {
      await signOut(firebaseAuth);
      return {
        ok: false,
        message:
          'This account is missing its Firestore profile. Open Register and submit the same email and password to finish setup.',
      };
    }

    return { ok: true, user: toClientUser(profileSnap.data()) };
  } catch (error) {
    if (error.code === 'auth/invalid-credential') {
      return { ok: false, message: 'Incorrect username/email or password.' };
    }
    if (error.code === 'permission-denied') {
      if (firebaseAuth.currentUser) {
        await signOut(firebaseAuth);
      }
      return {
        ok: false,
        message: 'Firestore denied access to your profile. Firestore rules must be deployed.',
      };
    }
    return { ok: false, message: error.message || 'Could not sign in.' };
  }
}

export async function resetFirebasePassword(email) {
  if (!isFirebaseConfigured) {
    return { ok: false, message: 'Firebase is not configured.' };
  }

  const normalizedEmail = normalize(email);
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { ok: false, message: 'Enter the email address for your account.' };
  }

  try {
    await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
    return { ok: true, message: 'Password reset email sent. Open it to create a new password.' };
  } catch (error) {
    if (error.code === 'auth/invalid-email') {
      return { ok: false, message: 'Enter a valid email address.' };
    }
    if (error.code === 'auth/user-not-found') {
      return { ok: false, message: 'No account matches that email address.' };
    }
    return { ok: false, message: error.message || 'Could not send the password reset email.' };
  }
}

export async function signOutFirebaseAccount() {
  if (isFirebaseConfigured) {
    await signOut(firebaseAuth);
  }
}

export function watchFirebaseUser(onUser) {
  if (!isFirebaseConfigured) {
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) {
      onUser(null);
      return;
    }

    try {
      const profileSnap = await getUserProfileWithRetry(user.uid);
      if (!profileSnap.exists()) {
        onUser(null);
        return;
      }
      onUser(toClientUser(profileSnap.data()));
    } catch (error) {
      console.error('[auth] Could not load Firebase user profile:', error.message || error);
      await signOut(firebaseAuth);
      onUser(null);
    }
  });
}

