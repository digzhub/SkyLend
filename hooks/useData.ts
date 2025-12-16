import { useState, useEffect, useCallback } from 'react';
import { DB, Loan, Transaction, Collector, Attendance, PayrollRecord, AuditLog, Investor, Task, Asset, FirebaseConfig, GoogleSheetsConfig } from '../types';
import { genId, getToday } from '../utils';

// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, 
  enableIndexedDbPersistence, setDoc, query, orderBy, limit 
} from 'firebase/firestore';

const STORAGE_KEY = 'SKYLEND_V30_PRO_DB';
const CONFIG_KEY = 'SKYLEND_FIREBASE_CONFIG';
const GSHEETS_KEY = 'SKYLEND_GSHEETS_CONFIG';

const DEFAULT_DB: DB = {
  collectors: [{ id: 1, name: 'Admin', area: 'HQ', pass: 'admin123', dailyRate: 0, monthlyRate: 0, quota: 0 }],
  investors: [],
  tasks: [],
  assets: [],
  loans: [],
  ledger: [],
  attendance: [],
  payroll: [],
  audit: []
};

export const useData = () => {
  const [db, setDb] = useState<DB>(DEFAULT_DB);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCloud, setIsCloud] = useState(false);
  const [firestore, setFirestore] = useState<any>(null);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Initialize Data Source
  useEffect(() => {
    const init = async () => {
      const configStr = localStorage.getItem(CONFIG_KEY);
      
      if (configStr) {
        try {
          const config: FirebaseConfig = JSON.parse(configStr);
          const app = initializeApp(config);
          const fStore = getFirestore(app);
          
          try {
            await enableIndexedDbPersistence(fStore);
          } catch (err: any) {
             // Silence persistence errors
          }

          setFirestore(fStore);
          setIsCloud(true);
        } catch (e) {
          console.error("Firebase Init Failed", e);
          setFirebaseError("Cloud Connection Failed. Reverting to Local.");
          loadLocal();
        }
      } else {
        loadLocal();
      }
      setIsInitialized(true);
    };

    init();
  }, []);

  const loadLocal = () => {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Ensure new fields exist
        setDb(prev => ({...DEFAULT_DB, ...parsed, assets: parsed.assets || []}));
      } catch (e) {
        setDb(DEFAULT_DB);
      }
    } else {
      setDb(DEFAULT_DB);
    }
  };

  // Sync Local Storage (Only in Local Mode)
  useEffect(() => {
    if (!isCloud && isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    }
  }, [db, isInitialized, isCloud]);

  // Sync Firestore (Only in Cloud Mode)
  useEffect(() => {
    if (isCloud && firestore) {
      const collections = ['collectors', 'loans', 'ledger', 'attendance', 'payroll', 'investors', 'tasks', 'assets', 'audit'];
      const unsubs: Function[] = [];

      collections.forEach(col => {
        const q = query(collection(firestore, col));
        const unsub = onSnapshot(q, (snapshot: any) => {
          const docs = snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
          setDb(prev => ({ ...prev, [col]: docs }));
        }, (error: any) => {
          console.error(`Error syncing ${col}:`, error);
          setFirebaseError(`Lost connection to ${col}`);
        });
        unsubs.push(unsub);
      });

      return () => {
        unsubs.forEach(u => u());
      };
    }
  }, [isCloud, firestore]);

  // Helper for Database Actions
  const executeAction = useCallback(async (collectionName: string, action: 'add' | 'update' | 'delete', data: any, id?: string | number) => {
    if (isCloud && firestore) {
      try {
        if (action === 'add') {
          if (data.id) {
            await setDoc(doc(firestore, collectionName, String(data.id)), data);
          } else {
            await addDoc(collection(firestore, collectionName), data);
          }
        } else if (action === 'update' && id) {
          await updateDoc(doc(firestore, collectionName, String(id)), data);
        } else if (action === 'delete' && id) {
          await deleteDoc(doc(firestore, collectionName, String(id)));
        }
      } catch (e) {
        console.error("Cloud Action Failed", e);
        alert("Action failed to sync to cloud. Check connection.");
      }
    } else {
      // Local Mode Fallback
      setDb(prev => {
        const list = (prev as any)[collectionName] as any[];
        let newList = [...list];

        if (action === 'add') {
          newList = [data, ...newList];
        } else if (action === 'update') {
          newList = newList.map(item => item.id === id ? { ...item, ...data } : item);
        } else if (action === 'delete') {
          newList = newList.filter(item => item.id !== id);
        }
        return { ...prev, [collectionName]: newList };
      });
    }
  }, [isCloud, firestore]);

  // --- Actions ---

  const logAction = useCallback((action: AuditLog['action'], details: string, user: string) => {
    const log: AuditLog = {
      id: genId(),
      timestamp: new Date().toLocaleString(),
      user,
      action,
      details
    };
    executeAction('audit', 'add', log);
  }, [executeAction]);

  const addLedger = useCallback((type: Transaction['type'], desc: string, amt: number, user: string, dateOverride?: string, category?: string) => {
    const newTx: Transaction = {
      id: genId(),
      date: new Date().toLocaleString(),
      simpleDate: dateOverride || getToday(),
      type,
      desc,
      amt,
      user,
      category
    };
    executeAction('ledger', 'add', newTx);
  }, [executeAction]);

  const addCapital = useCallback((amount: number, user: string) => {
    addLedger('Capital', 'Internal Capital Injection', amount, user);
    logAction('UPDATE', `Injected Capital: ${amount}`, user);
  }, [addLedger, logAction]);

  const createLoan = useCallback((loanData: Omit<Loan, 'id' | 'status' | 'balance' | 'total' | 'daily' | 'date'>, user: string) => {
    const rate = loanData.term === 40 ? 0.10 : (loanData.term === 30 ? 0.05 : 0.20);
    const total = loanData.principal + (loanData.principal * rate);
    const daily = Math.ceil(total / loanData.term);
    
    const newLoan: Loan = {
      ...loanData,
      id: genId(),
      total,
      balance: total,
      daily,
      date: getToday(),
      status: 'Active',
      collateral: loanData.collateral || 'Unsecured',
      notes: loanData.notes || ''
    };

    executeAction('loans', 'add', newLoan);
    addLedger('Disbursement', `Loan: ${newLoan.name}`, -newLoan.principal, user);
    
    if (newLoan.serviceFee && newLoan.serviceFee > 0) {
      addLedger('Collection', `Service Fee: ${newLoan.name}`, newLoan.serviceFee, user, undefined, 'Fee');
    }
    if (newLoan.deliveryCharge && newLoan.deliveryCharge > 0) {
      addLedger('Collection', `Delivery Charge: ${newLoan.name}`, newLoan.deliveryCharge, user, undefined, 'Fee');
    }

    logAction('CREATE', `New Loan Created: ${newLoan.name}`, user);
  }, [executeAction, addLedger, logAction]);

  const refinanceLoan = useCallback((oldLoanId: string, newPrincipal: number, newTerm: number, serviceFee: number, deliveryCharge: number, user: string) => {
    const oldLoan = db.loans.find(l => l.id === oldLoanId);
    if (!oldLoan) return;

    executeAction('loans', 'update', { status: 'Paid', balance: 0 }, oldLoanId);

    const rate = newTerm === 40 ? 0.10 : (newTerm === 30 ? 0.05 : 0.20);
    const total = newPrincipal + (newPrincipal * rate);
    const daily = Math.ceil(total / newTerm);
    
    const newLoan: Loan = {
      id: genId(),
      name: oldLoan.name,
      area: oldLoan.area,
      principal: newPrincipal,
      total,
      balance: total,
      daily,
      term: newTerm,
      date: getToday(),
      status: 'Active',
      address: oldLoan.address,
      cellNumber: oldLoan.cellNumber,
      serviceFee,
      deliveryCharge,
      collateral: oldLoan.collateral,
      notes: "Refinanced from previous loan."
    };
    executeAction('loans', 'add', newLoan);

    addLedger('Collection', `Refinance Payment: ${oldLoan.name}`, oldLoan.balance, user);
    addLedger('Disbursement', `Refinance Loan: ${newLoan.name}`, -newPrincipal, user);

    if (serviceFee > 0) addLedger('Collection', `Service Fee (Ref): ${newLoan.name}`, serviceFee, user, undefined, 'Fee');
    if (deliveryCharge > 0) addLedger('Collection', `Delivery Charge (Ref): ${newLoan.name}`, deliveryCharge, user, undefined, 'Fee');

    logAction('UPDATE', `Loan Refinanced: ${oldLoan.name}`, user);
  }, [db.loans, executeAction, addLedger, logAction]);

  const processPayment = useCallback((loanId: string, amount: number, user: string, dateOverride?: string) => {
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) return;

    const paymentAmount = Math.min(amount, loan.balance + 0.5); 
    let newBal = loan.balance - paymentAmount;
    let newStatus = loan.status;

    if (newBal <= 0.5) {
      newBal = 0;
      newStatus = 'Paid';
    }

    executeAction('loans', 'update', { balance: newBal, status: newStatus }, loanId);
    addLedger('Collection', `Payment: ${loan.name}`, amount, user, dateOverride);
  }, [db.loans, executeAction, addLedger]);

  const deleteLoan = useCallback((id: string) => {
    const loan = db.loans.find(l => l.id === id);
    if(loan) {
        executeAction('loans', 'delete', null, id);
        logAction('DELETE', `Loan Deleted: ${loan.name}`, 'Admin');
    }
  }, [db.loans, executeAction, logAction]);

  const updateCollector = useCallback((collector: Collector) => {
    const exists = db.collectors.find(c => c.id === collector.id);
    if (exists) {
        executeAction('collectors', 'update', collector, collector.id);
    } else {
        executeAction('collectors', 'add', collector);
    }
    logAction('UPDATE', `Collector Updated/Created: ${collector.name}`, 'Admin');
  }, [db.collectors, executeAction, logAction]);

  const deleteCollector = useCallback((id: number | string) => {
    if (id === 1 || id === '1') {
      alert("Cannot delete Admin");
      return;
    }
    const col = db.collectors.find(c => c.id === id);
    if(col) {
        executeAction('collectors', 'delete', null, id);
        logAction('DELETE', `Collector Deleted: ${col.name}`, 'Admin');
    }
  }, [db.collectors, executeAction, logAction]);

  const markAttendance = useCallback((date: string, empId: string | number, status: Attendance['status']) => {
    const existing = db.attendance.find(a => a.date === date && a.empId == empId);
    if (existing && existing.id) {
       executeAction('attendance', 'update', { status }, existing.id);
    } else {
       executeAction('attendance', 'add', { id: genId(), date, empId, status });
    }
  }, [db.attendance, executeAction]);

  const processPayroll = useCallback((records: PayrollRecord[], user: string) => {
    records.forEach(r => {
        executeAction('payroll', 'add', r);
        addLedger('Payroll', `Salary: ${r.empName} (${r.month})`, -r.netPay, user);
    });
    logAction('CREATE', `Payroll Processed for ${records.length} employees`, user);
  }, [executeAction, addLedger, logAction]);

  const addInvestor = useCallback((investor: Investor) => {
    executeAction('investors', 'add', investor);
    addLedger('Capital', `Investment: ${investor.name}`, investor.capitalInvested, 'Admin');
    logAction('CREATE', `New Investor Added: ${investor.name}`, 'Admin');
  }, [executeAction, addLedger, logAction]);

  const payDividend = useCallback((investorId: string, amount: number) => {
    const inv = db.investors.find(i => i.id === investorId);
    if (inv) {
        executeAction('investors', 'update', { totalPayouts: inv.totalPayouts + amount }, investorId);
        addLedger('Dividend', `Payout: ${inv.name}`, -amount, 'Admin');
        logAction('UPDATE', `Dividend Paid: ${inv.name}`, 'Admin');
    }
  }, [db.investors, executeAction, addLedger, logAction]);

  const addTask = useCallback((task: Task) => {
    executeAction('tasks', 'add', task);
  }, [executeAction]);

  const updateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    executeAction('tasks', 'update', { status }, taskId);
  }, [executeAction]);

  const addAsset = useCallback((asset: Asset) => {
    executeAction('assets', 'add', asset);
    logAction('CREATE', `Asset Added: ${asset.name}`, 'Admin');
  }, [executeAction, logAction]);

  const updateAsset = useCallback((asset: Asset) => {
    executeAction('assets', 'update', asset, asset.id);
  }, [executeAction]);

  const deleteAsset = useCallback((id: string) => {
    executeAction('assets', 'delete', null, id);
    logAction('DELETE', 'Asset Removed', 'Admin');
  }, [executeAction, logAction]);

  const hardReset = useCallback(() => {
    if (window.confirm("FACTORY RESET? All Data Lost!")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONFIG_KEY);
      localStorage.removeItem(GSHEETS_KEY);
      window.location.reload();
    }
  }, []);

  const importData = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (isCloud) {
          alert("Bulk import is only available in Local Mode.");
          return;
      }
      setDb(prev => ({...DEFAULT_DB, ...parsed}));
      alert("Database restored successfully!");
    } catch (e) {
      alert("Error reading backup file.");
    }
  }, [isCloud]);

  const saveFirebaseConfig = useCallback((config: FirebaseConfig) => {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      window.location.reload();
  }, []);

  const saveGoogleSheetsConfig = useCallback((config: GoogleSheetsConfig) => {
      localStorage.setItem(GSHEETS_KEY, JSON.stringify(config));
      alert("Google Sheets configuration saved (Simulation Mode).");
  }, []);

  const disconnectCloud = useCallback(() => {
      if(confirm("Disconnect from Cloud? You will revert to Local Mode.")) {
          localStorage.removeItem(CONFIG_KEY);
          window.location.reload();
      }
  }, []);

  const uploadLocalToCloud = useCallback(async () => {
    if (!isCloud || !firestore) {
      alert("Must be connected to cloud first.");
      return;
    }
    if (confirm("Upload local data to Cloud?")) {
       const keys: (keyof DB)[] = ['collectors', 'loans', 'ledger', 'attendance', 'payroll', 'investors', 'tasks', 'assets', 'audit'];
       let count = 0;
       for (const key of keys) {
          const list = db[key] as any[];
          for (const item of list) {
              const docData = { ...item };
              if (!docData.id) docData.id = genId();
              else docData.id = String(docData.id);
              try {
                await setDoc(doc(firestore, key, docData.id), docData);
                count++;
              } catch(e) {}
          }
       }
       alert(`Migration complete. Uploaded ${count} documents.`);
    }
  }, [isCloud, firestore, db]);

  return {
    db,
    isInitialized,
    isCloud,
    firebaseError,
    addLedger,
    addCapital,
    createLoan,
    refinanceLoan,
    processPayment,
    deleteLoan,
    updateCollector,
    deleteCollector,
    markAttendance,
    processPayroll,
    hardReset,
    importData,
    logAction,
    addInvestor,
    payDividend,
    addTask,
    updateTaskStatus,
    addAsset,
    updateAsset,
    deleteAsset,
    saveFirebaseConfig,
    saveGoogleSheetsConfig,
    disconnectCloud,
    uploadLocalToCloud
  };
};