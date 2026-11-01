import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuração do Firebase fornecida pelo usuário (projeto: escola-f0815)
export const firebaseConfig = {
  apiKey: 'AIzaSyBP95c7J9uiZL6SlByvPN8mEBouzpb4sOw',
  authDomain: 'escola-f0815.firebaseapp.com',
  projectId: 'escola-f0815',
  storageBucket: 'escola-f0815.firebasestorage.app',
  messagingSenderId: '953905257113',
  appId: '1:953905257113:web:9bfe632b6a796649f0f608',
  measurementId: 'G-1H5JMEBCHT',
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Verificação de conexão com o Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or database initializing.');
    }
  }
}
testConnection();
