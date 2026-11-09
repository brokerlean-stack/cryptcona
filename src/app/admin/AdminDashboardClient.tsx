"use client";
import UserAvatar from "@/components/ui/UserAvatar";

import { useState, useMemo, useEffect, useRef, ReactNode } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Users,
  CreditCard,
  Search,
  Plus,
  MapPin,
  Mail,
  User as UserIcon,
  LogOut,
  ExternalLink,
  Clock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  MessageSquare,
  Send,
  FileText,
  ChevronDown,
  LayoutDashboard,
  Image as ImageIcon,
  Paperclip,
  ChevronLeft,
  Radio,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "@/components/ui/NotificationBell";
import PaymentMethodsEditor from "./PaymentMethodsEditor";
import CopyTradingAdmin from './CopyTradingAdmin';
import { parseProfitAmount } from "@/lib/profitAmount";

export default function AdminDashboardClient({
  users,
  deposits,
  withdrawals,
  settings,
}: any) {
  const [activeTab, setActiveTab] = useState("DASHBOARD");
  const [finSubTab, setFinSubTab] = useState<"DEPOSITS" | "WITHDRAWALS">(
    "DEPOSITS",
  );
  const [localSettings, setLocalSettings] = useState(settings);
  const [userSearch, setUserSearch] = useState("");
  const [notif, setNotif] = useState<{
    show: boolean;
    msg: string;
    type: "success" | "error";
  }>({ show: false, msg: "", type: "success" });

  // Modals
  const [selectedUserForMoney, setSelectedUserForMoney] = useState<any>(null);
  const [selectedUserForMsg, setSelectedUserForMsg] = useState<any>(null);
  const [selectedUserForKyc, setSelectedUserForKyc] = useState<any>(null);
  const [selectedUserForWCode, setSelectedUserForWCode] = useState<any>(null);
  const [newWithdrawalCode, setNewWithdrawalCode] = useState("");

  // AI Trader State
  const [selectedUserForAI, setSelectedUserForAI] = useState<any>(null);
  const [aiProfitAmt, setAiProfitAmt] = useState("");
  const [creditingProfit, setCreditingProfit] = useState(false);
  const profitRequestPending = useRef(false);
  const [aiActive, setAiActive] = useState(false);

  // Messaging (One-way Notification) State
  const [msgSubject, setMsgSubject] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Chat (Live Two-way) State
  const [chatTarget, setChatTarget] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatImage, setChatImage] = useState<string | null>(null);
  const chatSendLock = useRef(false);
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  const TEMPLATES = [
    {
      id: 1,
      name: "Withdrawal Pending",
      subject: "Withdrawal Request Received",
      title: "Your Withdrawal is Being Processed",
      body: "We have received your withdrawal request. Please note that it typically takes 3 hours to 4 business days to process and verify the funds before they are released to your destination wallet.",
    },
    {
      id: 2,
      name: "Withdrawal Held (Hold)",
      subject: "Security Hold on Withdrawal",
      title: "Action Required: Withdrawal Temporary Held",
      body: "Your recent withdrawal request has been flagged due to suspicious activity in your account. To proceed with the release of your funds, you are required to perform a security verification deposit of [AMOUNT] [CURRENCY]. Once verified, both amounts will be available for withdrawal.",
    },
    {
      id: 3,
      name: "Account Upgrade",
      subject: "Account Tier Upgrade Required",
      title: "Account plan update",
      body: "To unlock higher trading limits and priority withdrawals, your account needs to be upgraded to the Elite Institutional Tier. Please contact your account manager for the specific requirements for your region.",
    },
    {
      id: 4,
      name: "KYC Verified",
      subject: "KYC Verification Successful",
      title: "Account Fully Verified",
      body: "Congratulations! Your account has passed our identity verification. All restriction levels have been lifted and your account is now in good standing.",
    },
    {
      id: 5,
      name: "Direct Refund",
      subject: "Refund Credited to Account",
      title: "Transaction Refund Notice",
      body: "A recent transaction has been reversed and the amount has been successfully refunded back to your primary trading balance. You may now continue your trading activities.",
    },
  ];

  const applyTemplate = (t: any) => {
    setMsgSubject(t.subject);
    setMsgTitle(t.title);
    setMsgBody(t.body);
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notif.show) {
      const timer = setTimeout(() => setNotif({ ...notif, show: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  const showMessage = (msg: string, type: "success" | "error" = "success") => {
    setNotif({ show: true, msg, type });
  };

  // Chat Logic
  useEffect(() => {
    if (activeTab === "CHATS" && chatTarget) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, chatTarget]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    if (!chatTarget) return;
    const res = await fetch(`/api/messages?userId=${chatTarget._id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const handleSendChat = async () => {
    if (!chatTarget || (!chatInput.trim() && !chatImage) || chatSendLock.current) return;
    chatSendLock.current = true;
    setChatSending(true);
    try {

    const payload = {
      receiverId: chatTarget._id,
      content: chatInput,
      image: chatImage,
    };

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setChatInput("");
      setChatImage(null);
      fetchMessages();
    } else { const data = await res.json(); alert(data.error || "Unable to send message."); }
    } catch { alert("Unable to send message. Please try again."); }
    finally { chatSendLock.current = false; setChatSending(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      alert("Choose a PNG, JPEG or WebP image under 5 MB."); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setChatImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Filter deposits
  const pendingDeposits = deposits.filter((d: any) => d.status === "PENDING");

  // Search Users
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u: any) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()),
    );
  }, [users, userSearch]);

  // Actions
  const handleApproveDeposit = async (
    id: string,
    userId: string,
    amount: number,
  ) => {
    const res = await fetch("/api/admin/deposits/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId, amount }),
    });
    if (res.ok) {
      showMessage("Deposit approved and verified!");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleRejectDeposit = async (id: string) => {
    const res = await fetch("/api/admin/deposits/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showMessage("Deposit rejected.");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleUpdateWithdrawal = async (id: string, status: string) => {
    const res = await fetch("/api/admin/withdrawals/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      showMessage(`Withdrawal status updated to ${status.replace("_", " ")}`);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleUpdateSetting = async (key: string, value: string) => {
    const res = await fetch("/api/admin/settings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (res.ok) showMessage("Global setting updated!");
  };

  const handleGenerateWithdrawalCode = async () => {
    if (!selectedUserForWCode || !newWithdrawalCode) return;
    const res = await fetch("/api/admin/users/withdrawal-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserForWCode._id,
        code: newWithdrawalCode,
      }),
    });
    if (res.ok) {
      showMessage("Withdrawal code generated successfully!");
      setSelectedUserForWCode(null);
      setNewWithdrawalCode("");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showMessage("Failed to generate code", "error");
    }
  };

  const [addMoneyAmt, setAddMoneyAmt] = useState("");
  const handleAddMoneySubmit = async () => {
    if (!selectedUserForMoney || !addMoneyAmt) return;
    const res = await fetch("/api/admin/users/add-money", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserForMoney._id,
        amount: parseFloat(addMoneyAmt),
      }),
    });
    if (res.ok) {
      showMessage("Balance updated and user notified via email!");
      setSelectedUserForMoney(null);
      setAddMoneyAmt("");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUserForMsg || !msgSubject || !msgBody) return;
    setIsSendingMsg(true);
    const res = await fetch("/api/admin/users/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserForMsg._id,
        subject: msgSubject,
        title: msgTitle,
        body: msgBody,
      }),
    });
    setIsSendingMsg(false);
    if (res.ok) {
      showMessage("Account message sent.");
      setSelectedUserForMsg(null);
      setMsgSubject("");
      setMsgTitle("");
      setMsgBody("");
    }
  };

  const handleKycStatusUpdate = async (status: string) => {
    if (!selectedUserForKyc) return;
    const res = await fetch("/api/admin/users/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserForKyc._id, status }),
    });
    if (res.ok) {
      showMessage(`User KYC marked as ${status.toUpperCase()}`);
      setSelectedUserForKyc(null);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showMessage(`Failed to update KYC status`, "error");
    }
  };

  const handleUpdateAISettings = async () => {
    if (!selectedUserForAI) return;
    const res = await fetch("/api/admin/users/ai-trader/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserForAI._id,
        aiTraderActive: aiActive,
        aiProfitTarget: parseFloat(aiProfitAmt) || 0,
      }),
    });
    if (res.ok) {
      showMessage("AI Trader settings synchronization complete!");
      setSelectedUserForAI(null);
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleExecuteAIProfit = async () => {
    if (!selectedUserForAI || profitRequestPending.current) return;
    const amount = parseProfitAmount(aiProfitAmt);
    if (amount === null) {
      showMessage(
        "Enter a positive profit amount with at most two decimal places.",
        "error",
      );
      return;
    }
    profitRequestPending.current = true;
    setCreditingProfit(true);
    try {
      const res = await fetch("/api/admin/users/ai-trader/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForAI._id,
          amount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message);
        setSelectedUserForAI(null);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage(data.error || "Unable to credit profit.", "error");
      }
    } catch {
      showMessage(
        "Could not confirm the credit. Check the user balance before trying again.",
        "error",
      );
    } finally {
      profitRequestPending.current = false;
      setCreditingProfit(false);
    }
  };

  const TABS = [
    { id: "DASHBOARD", label: "Overview", icon: <LayoutDashboard size={20} /> },
    { id: "FINANCIALS", label: "Funding", icon: <CreditCard size={20} /> },
    { id: "USERS", label: "Clients", icon: <Users size={20} /> },
    { id: "SUBS", label: "Plans", icon: <TrendingUp size={20} /> },
    { id: "CHATS", label: "Chats", icon: <MessageSquare size={20} /> },
    { id: "SETTINGS", label: "Settings", icon: <SettingsIcon size={20} /> },
    { id: "COPY", label: "Copy trading", icon: <Users size={20} /> },
  ];

  const stats = [
    {
      label: "Active Traders",
      value: users.length,
      color: "blue",
      icon: <Users size={16} />,
    },
    {
      label: "Pending Tasks",
      value: pendingDeposits.length,
      color: "gold",
      icon: <Clock size={16} />,
    },
    {
      label: "Security Level",
      value: "Level 4",
      color: "green",
      icon: <ShieldCheck size={16} />,
    },
  ];

  return (
    <div className="cc-admin min-h-screen bg-[#111514] text-zinc-100 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-[#151b18] border-r border-white/5 sticky top-0 h-screen p-8 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-lg bg-brand-mint flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
              <ShieldCheck className="text-brand-mint" size={24} />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-normal">cryptcona</h1>
            <p className="text-[10px] text-zinc-500 font-bold tracking-normal leading-none">
              Admin Console
            </p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg font-semibold text-xs tracking-normal transition-all ${
                activeTab === tab.id
                  ? "bg-brand-mint text-black shadow-lg shadow-brand-mint/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-mint/20 to-transparent border border-brand-mint/20 flex items-center justify-center">
              <UserIcon className="text-brand-mint" size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold">Administrator</p>
              <p className="text-[10px] text-zinc-500 font-bold">
                Secure Session Active
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-zinc-500 font-bold text-[10px] tracking-normal hover:text-red-400 hover:border-red-400/30 transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#151b18] border-b border-white/5 px-6 py-5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-brand-mint" size={24} />
            <h1 className="text-lg font-semibold tracking-normal">
              Admin{" "}
              <span className="text-brand-mint underline decoration-white/20 underline-offset-4 decoration-2">
                Core
              </span>
            </h1>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_green]" />
        </header>

        {/* Notifications */}
        <AnimatePresence>
          {notif.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-4 border ${
                notif.type === "success"
                  ? "bg-[#0a1f13] border-green-500/30 text-green-400"
                  : "bg-[#1f0a0a] border-red-500/30 text-red-400"
              }`}
            >
              {notif.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span className="font-semibold text-[10px] tracking-normal">
                {notif.msg}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
          {/* Welcome Section */}
          {activeTab !== "CHATS" && (
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div>
                <p className="text-brand-mint font-semibold text-xs mb-3">
                  CRYPTCONA / ADMINISTRATION
                </p>
                <h2 className="font-semibold leading-none">
                  {TABS.find((tab) => tab.id === activeTab)?.label}
                </h2>
              </div>
              <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-3 min-w-0">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="glass min-w-0 px-3 py-4 rounded-lg border-white/5 text-center flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-3">
                      {s.icon}
                    </div>
                    <p className="text-[9px] text-zinc-500 font-semibold tracking-normal mb-1">
                      {s.label}
                    </p>
                    <p className="text-xl font-semibold text-white">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Tabs */}
          <AnimatePresence mode="wait">
            {activeTab === "DASHBOARD" && (
              <motion.div
                key="db"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <DashCard
                    label="Real-Time Orders"
                    value={pendingDeposits.length}
                    color="gold"
                    desc="Pending for review"
                  />
                  <DashCard
                    label="Total Userbase"
                    value={users.length}
                    color="blue"
                    desc="Verified traders"
                  />
                  <DashCard
                    label="System Integrity"
                    value="OPTIMAL"
                    color="green"
                    desc="No breaches detected"
                  />
                </div>

                <div className="glass p-8 rounded-lg border-white/5">
                  <h3 className="text-sm font-semibold tracking-normal text-zinc-600 mb-8 border-b border-white/5 pb-6 flex items-center justify-between">
                    Recent Activity Log
                    <TrendingUp className="text-zinc-800" size={16} />
                  </h3>
                  <div className="space-y-6">
                    {deposits.slice(0, 5).map((d: any) => (
                      <div
                        key={d._id}
                        className="flex items-center justify-between pb-6 border-b border-white/5 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                            <UserIcon className="text-zinc-600" size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">
                              {d.userId?.email || "System Account"}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-bold tracking-normal mt-1">
                              {d.method} Transaction
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-white">
                            +{d.currency} {d.amountLocal.toLocaleString()}
                          </p>
                          <p
                            className={`text-[8px] font-semibold tracking-normal mt-1 ${d.status === "APPROVED" ? "text-green-500" : "text-brand-mint"}`}
                          >
                            {d.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "FINANCIALS" && (
              <motion.div
                key="fin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex p-1 bg-white/5 rounded-lg w-fit border border-white/5">
                  <button
                    onClick={() => setFinSubTab("DEPOSITS")}
                    className={`px-8 py-3 rounded-lg text-[10px] font-semibold tracking-normal transition-all ${finSubTab === "DEPOSITS" ? "bg-brand-mint text-black shadow-lg shadow-brand-mint/20" : "text-zinc-500 hover:text-white"}`}
                  >
                    Incoming Payments
                  </button>
                  <button
                    onClick={() => setFinSubTab("WITHDRAWALS")}
                    className={`px-8 py-3 rounded-lg text-[10px] font-semibold tracking-normal transition-all ${finSubTab === "WITHDRAWALS" ? "bg-brand-mint text-black shadow-lg shadow-brand-mint/20" : "text-zinc-500 hover:text-white"}`}
                  >
                    Outbound Requests
                  </button>
                </div>

                {finSubTab === "DEPOSITS" ? (
                  <div className="grid gap-6">
                    <h4 className="text-[10px] font-semibold text-zinc-600 tracking-normal ml-2">
                      Deposit Queue ({pendingDeposits.length})
                    </h4>
                    {pendingDeposits.length === 0 ? (
                      <div className="glass p-16 text-center rounded-lg border-white/5">
                        <p className="text-zinc-500 font-semibold text-xs tracking-normal">
                          Zero Deposits Pending
                        </p>
                      </div>
                    ) : (
                      pendingDeposits.map((d: any) => (
                        <div
                          key={d._id}
                          className="glass p-6 md:p-8 rounded-lg border-white/5 hover:border-brand-mint/20 transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-lg bg-black border border-white/10 flex items-center justify-center">
                              <ArrowUpRight
                                className="text-zinc-500"
                                size={30}
                              />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold">
                                {d.userId?.name || "Trader"}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-bold tracking-normal mt-1">
                                {d.userId?.email}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-2 gap-8">
                            <div>
                              <p className="text-[9px] text-zinc-600 font-semibold tracking-normal mb-1">
                                Amount
                              </p>
                              <p className="text-xl font-semibold">
                                {d.currency} {d.amountLocal.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-semibold tracking-normal mb-1">
                                Method
                              </p>
                              <p className="text-xs font-semibold text-brand-mint">
                                {d.method}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={() =>
                                handleApproveDeposit(
                                  d._id,
                                  d.userId?._id,
                                  d.amountLocal,
                                )
                              }
                              className="py-4 px-8 bg-brand-mint text-black rounded-lg font-semibold text-xs tracking-normal hover:scale-105 active:scale-95 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(d._id)}
                              className="py-4 px-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6">
                    <h4 className="text-[10px] font-semibold text-zinc-600 tracking-normal ml-2">
                      Withdrawal Requests (
                      {
                        withdrawals.filter(
                          (w: any) =>
                            w.status !== "APPROVED" && w.status !== "REJECTED",
                        ).length
                      }
                      )
                    </h4>
                    {withdrawals.length === 0 ? (
                      <div className="glass p-16 text-center rounded-lg border-white/5">
                        <p className="text-zinc-500 font-semibold text-xs tracking-normal">
                          Zero Withdrawal Requests
                        </p>
                      </div>
                    ) : (
                      withdrawals.map((w: any) => (
                        <div
                          key={w._id}
                          className="glass p-8 rounded-lg border-white/5 hover:border-brand-mint/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-8"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-2xl">
                              <CreditCard
                                className={`${w.status === "UNDER_REVIEW" ? "text-brand-mint" : "text-zinc-500"}`}
                                size={30}
                              />
                            </div>
                            <div>
                              <h4 className="text-base font-semibold tracking-normal">
                                {w.userId?.name || "Trader"}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-bold tracking-normal mt-1">
                                {w.userId?.email}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 max-w-xl">
                            <div>
                              <p className="text-[9px] text-zinc-600 font-semibold tracking-normal mb-1">
                                Dest. Wallet
                              </p>
                              <p className="text-[10px] font-mono text-zinc-300 break-all select-all bg-black/40 p-2 rounded-lg">
                                {w.walletAddress}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-semibold tracking-normal mb-1">
                                Amount
                              </p>
                              <p className="text-xl font-semibold">
                                {w.currency} {w.amountLocal.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-semibold tracking-normal mb-1">
                                Status
                              </p>
                              <p
                                className={`text-[10px] font-semibold tracking-normal ${w.status === "PENDING" ? "text-zinc-500" : w.status === "UNDER_REVIEW" ? "text-brand-mint animate-pulse" : "text-white"}`}
                              >
                                {w.status.replace("_", " ")}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleUpdateWithdrawal(w._id, "APPROVED")
                              }
                              className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
                              title="Approve Payment"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateWithdrawal(w._id, "UNDER_REVIEW")
                              }
                              className="p-4 bg-brand-mint text-black rounded-lg hover:brightness-110 transition-all shadow-lg shadow-brand-mint/20"
                              title="Mark Under Review"
                            >
                              <Clock size={20} />
                            </button>
                            <button
                              onClick={() => setSelectedUserForMsg(w.userId)}
                              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                              title="Send Security Alert"
                            >
                              <Mail size={20} />
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateWithdrawal(w._id, "REJECTED")
                              }
                              className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
                              title="Reject Payment"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "USERS" && (
              <motion.div
                key="usr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h3 className="text-sm font-semibold tracking-normal text-zinc-600 ml-2">
                    Market Participants
                  </h3>
                  <div className="relative group w-full md:w-96">
                    <Search
                      className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-mint transition-colors"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="FILTER DATABASE BY NAME OR EMAIL..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-[#151b18] border-2 border-white/5 rounded-lg py-5 pl-16 pr-8 text-xs font-semibold tracking-normal focus:outline-none focus:border-brand-mint/30 transition-all placeholder:text-zinc-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredUsers.map((u: any) => (
                    <div
                      key={u._id}
                      className="glass p-7 rounded-lg border-white/5 space-y-6 group hover:border-white/10 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center font-semibold text-2xl text-white border border-white/5 shadow-2xl">
                            <UserAvatar name={u.name} photo={u.profilePhoto} alt={`${u.name} profile photo`} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold tracking-normal">
                              {u.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_green]" />
                              <p className="text-[10px] text-zinc-600 font-bold tracking-normal">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold tracking-normal text-zinc-500">
                            {u.country || "N/A"}
                          </div>
                          {u.subscription && u.subscription !== "none" && (
                            <div className="px-5 py-2.5 bg-brand-mint text-black rounded-lg text-[10px] font-semibold tracking-normal shadow-lg shadow-brand-mint/20 flex items-center gap-2">
                              <TrendingUp size={12} /> {u.subscription}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111514] p-4 rounded-lg border border-white/5 flex flex-col items-start gap-4 min-w-0">
                          <div>
                            <p className="text-[9px] text-zinc-700 font-semibold tracking-normal mb-1.5">
                              Net Equity
                            </p>
                            <p className="text-xl font-semibold text-brand-mint select-all">
                              {u.currency} {u.balance.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedUserForKyc(u)}
                              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${u.verificationStatus === "verified" ? "bg-green-600/20 text-green-500 border-green-500/30" : u.verificationStatus === "pending" ? "bg-amber-600/20 text-amber-500 border-amber-500/30 animate-pulse" : "bg-white/5 text-zinc-600 border-white/5 hover:bg-white/10"}`}
                              title="KYC Verification"
                            >
                              <ShieldCheck size={20} />
                            </button>
                            <button
                              onClick={() => setSelectedUserForMoney(u)}
                              className="w-12 h-12 rounded-lg bg-brand-mint/10 text-brand-mint border border-brand-mint/20 flex items-center justify-center hover:bg-brand-mint hover:text-black transition-all"
                            >
                              <DollarSign size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForAI(u);
                                setAiActive(u.aiTraderActive);
                                setAiProfitAmt(
                                  u.aiProfitTarget?.toString() || "",
                                );
                              }}
                              className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-all ${u.aiTraderActive ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-zinc-600 border-white/5 hover:bg-white/10"}`}
                              title="AI Trader Setup"
                            >
                              <Cpu size={20} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForWCode(u);
                                setNewWithdrawalCode(u.withdrawalCode || "");
                              }}
                              className="w-12 h-12 rounded-lg bg-cyan-600/20 text-cyan-500 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-600 hover:text-white transition-all"
                              title="Create Withdrawal Code"
                            >
                              <FileText size={20} />
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedUserForMsg(u)}
                          className="bg-white/5 border border-white/10 p-6 rounded-lg flex items-center justify-between hover:bg-brand-mint/10 hover:border-brand-mint/30 transition-all group/msg"
                        >
                          <div className="text-left">
                            <p className="text-[9px] text-zinc-700 font-semibold tracking-normal mb-1.5">
                              Account notification
                            </p>
                            <p className="text-xs font-semibold tracking-normal group-hover/msg:text-white">
                              Email Template
                            </p>
                          </div>
                          <Mail
                            size={20}
                            className="text-zinc-700 group-hover/msg:text-brand-mint"
                          />
                        </button>
                        <button
                          onClick={() => {
                            setChatTarget(u);
                            setActiveTab("CHATS");
                          }}
                          className="col-span-1 md:col-span-2 bg-[#1a211e] border border-white/5 p-5 rounded-lg flex items-center justify-center gap-3 hover:bg-white/5 transition-all"
                        >
                          <MessageSquare
                            size={18}
                            className="text-brand-mint"
                          />
                          <span className="text-[10px] font-semibold tracking-normal">
                            Open Live Secure Chat
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "CHATS" && (
              <motion.div
                key="cht"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-180px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 relative"
              >
                {/* Chat Sidebar (Contacts) */}
                <div
                  className={`w-full md:w-80 glass rounded-lg border-white/5 flex flex-col overflow-hidden shrink-0 ${chatTarget ? "hidden md:flex" : "flex"}`}
                >
                  <div className="p-6 border-b border-white/5">
                    <h3 className="text-xs font-semibold tracking-normal text-zinc-500 mb-4">
                      Client Conversations
                    </h3>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700"
                        size={14}
                      />
                      <input
                        type="text"
                        placeholder="SEARCH CONTACTS..."
                        className="w-full bg-black/40 border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-[10px] font-bold focus:outline-none"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {filteredUsers.map((u: any) => (
                      <button
                        key={u._id}
                        onClick={() => setChatTarget(u)}
                        className={`w-full p-5 flex items-center gap-4 border-b border-white/5 transition-all text-left ${chatTarget?._id === u._id ? "bg-brand-mint/10 border-r-4 border-r-brand-mint" : "hover:bg-white/5"}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center font-semibold text-brand-mint border border-white/10 shrink-0">
                          <UserAvatar name={u.name} photo={u.profilePhoto} alt={`${u.name} profile photo`} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold truncate">
                            {u.name}
                          </p>
                          <p className="text-[9px] text-zinc-600 font-bold truncate">
                            {u.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification Bell */}
                <div className="ml-auto mr-4">
                  <NotificationBell fetchUrl="/api/user/notifications" />
                </div>
                {/* Chat Window */}
                <div
                  className={`flex-1 glass rounded-lg border-white/5 flex flex-col overflow-hidden relative ${!chatTarget ? "hidden md:flex" : "flex"}`}
                >
                  {!chatTarget ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                        <MessageSquare className="text-zinc-800" size={40} />
                      </div>
                      <h3 className="text-xl font-semibold tracking-normal">
                        Client Chat Node
                      </h3>
                      <p className="text-[10px] text-zinc-600 font-bold tracking-normal mt-2 max-w-xs leading-relaxed">
                        Select a market participant from the left to start a
                        your account conversations.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-5 md:p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setChatTarget(null)}
                            className="md:hidden p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center">
                            <UserIcon className="text-brand-mint" size={24} />
                          </div>
                          <div>
                            <h4 className="text-xs md:text-sm font-semibold">
                              {chatTarget.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              <p className="text-[8px] md:text-[9px] text-zinc-500 font-bold tracking-normal">
                                Session Secure
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
                        {messages.map((m: any, idx) => {
                          const isMe =
                            m.senderId === chatTarget._id ? false : true;
                          return (
                            <div
                              key={idx}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] md:max-w-[70%] space-y-2`}
                              >
                                <div
                                  className={`p-4 rounded-lg text-sm font-medium leading-relaxed ${isMe ? "bg-brand-mint text-black rounded-br-none shadow-lg shadow-brand-mint/10" : "bg-white/5 text-zinc-200 border border-white/10 rounded-bl-none"}`}
                                >
                                  {m.content}
                                  {m.image && (
                                    <img
                                      src={m.image}
                                      className="mt-2 rounded-lg border border-black/20 max-w-full"
                                      alt="Shared attachment"
                                    />
                                  )}
                                </div>
                                <p
                                  className={`text-[8px] font-semibold tracking-normal text-zinc-600 ${isMe ? "text-right mr-2" : "text-left ml-2"}`}
                                >
                                  {new Date(m.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input Area */}
                      <div className="p-6 bg-black/40 border-t border-white/5 space-y-4">
                        {chatImage && (
                          <div className="relative inline-block">
                            <img
                              src={chatImage}
                              className="w-20 h-20 object-cover rounded-lg border-2 border-brand-mint"
                            />
                            <button
                              onClick={() => setChatImage(null)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 border-2 border-black"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <label className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all shrink-0">
                            <Paperclip className="text-zinc-500" size={20} />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="TYPE SECURE MESSAGE..."
                            className="flex-1 bg-black/60 border border-white/10 rounded-lg py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-brand-mint/40"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSendChat()
                            }
                          />
                          <button
                            onClick={handleSendChat}
                            disabled={chatSending}
                            className="w-14 h-14 rounded-lg bg-brand-mint text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand-mint/10 shrink-0"
                          >
                            <Send size={24} />
                          </button>
                          <ActionButton
                            href="/dashboard/subscription"
                            icon={<Radio size={22} />}
                            label="Get Signals"
                            color="purple"
                          />{" "}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "SUBS" && (
              <motion.div
                key="subs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-semibold tracking-normal">
                    VIP Signal{" "}
                    <span className="text-brand-mint">Subscriptions</span>
                  </h3>
                  <p className="text-zinc-600 text-[10px] font-bold tracking-normal leading-relaxed">
                    Monitor all subscription plans across active
                    traders.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users
                    .filter(
                      (u: any) => u.subscription && u.subscription !== "none",
                    )
                    .map((u: any) => (
                      <div
                        key={u._id}
                        className="glass p-8 rounded-lg border-white/5 space-y-6 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-mint/5 blur-3xl rounded-full" />
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-brand-mint/10 border border-brand-mint/20 flex items-center justify-center text-brand-mint shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]">
                            <TrendingUp size={28} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">
                              {u.name}
                            </p>
                            <p className="text-[9px] font-bold text-zinc-600 tracking-normal">
                              {u.email}
                            </p>
                          </div>
                        </div>

                        <div className="p-5 rounded-lg bg-black/40 border border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-semibold">
                            <span className="text-zinc-500 tracking-normal">
                              ACTIVE TIER
                            </span>
                            <span className="text-brand-mint">
                              {u.subscription}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-semibold">
                            <span className="text-zinc-500 tracking-normal">
                              PORTFOLIO
                            </span>
                            <span className="text-white">
                              {u.currency} {u.balance.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setChatTarget(u);
                              setActiveTab("CHATS");
                            }}
                            className="flex-1 py-3 bg-white/5 text-[9px] font-semibold tracking-normal rounded-lg hover:bg-white/10 transition-all border border-white/5"
                          >
                            Signal Support
                          </button>
                          <button
                            onClick={() => setSelectedUserForMsg(u)}
                            className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold tracking-normal rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                          >
                            Email Signals
                          </button>
                        </div>
                      </div>
                    ))}
                  {users.filter(
                    (u: any) => u.subscription && u.subscription !== "none",
                  ).length === 0 && (
                    <div className="col-span-full py-20 text-center glass rounded-lg border-white/5">
                      <TrendingUp
                        className="mx-auto text-zinc-800 mb-4"
                        size={40}
                      />
                      <p className="text-[10px] text-zinc-600 font-bold tracking-normal">
                        No active VIP subscriptions detected in the ledger.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "COPY" && <CopyTradingAdmin />}
            {activeTab === "SETTINGS" && (
              <motion.div
                key="set"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-semibold tracking-normal">
                    System <span className="text-brand-mint">Parameters</span>
                  </h3>
                  <p className="text-zinc-600 text-[10px] font-bold tracking-normal leading-relaxed">
                    Global configuration node for gateways <br />
                    and institutional touchpoints.
                  </p>
                </div>
                <div className="space-y-6">
                  <PaymentMethodsEditor
                    settings={localSettings}
                    onSaved={(saved) =>
                      setLocalSettings((current: any[]) =>
                        current.some((s) => s.key === saved.key)
                          ? current.map((s) =>
                              s.key === saved.key ? saved : s,
                            )
                          : [...current, saved],
                      )
                    }
                  />
                  {localSettings
                    .filter((s: any) => !s.key.startsWith("payment_"))
                    .map((s: any) => (
                      <div
                        key={s.key}
                        className="glass p-10 rounded-lg border-white/5 space-y-6 hover:shadow-2xl transition-all"
                      >
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-brand-mint">
                            <SettingsIcon size={18} />
                          </div>
                          <p className="text-[11px] font-semibold tracking-normal text-zinc-400">
                            {s.key.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div className="relative group/input">
                          <textarea
                            rows={1}
                            className="w-full bg-black/40 border-2 border-white/5 rounded-lg px-6 py-5 text-xs font-bold font-mono text-zinc-100 focus:outline-none focus:border-brand-mint/40 transition-all pr-24 no-scrollbar resize-none"
                            value={s.value}
                            onChange={(e) => {
                              const next = localSettings.map((item: any) =>
                                item.key === s.key
                                  ? { ...item, value: e.target.value }
                                  : item,
                              );
                              setLocalSettings(next);
                            }}
                          />
                          <button
                            onClick={() => handleUpdateSetting(s.key, s.value)}
                            className="absolute right-3 top-3 bottom-3 px-5 bg-brand-mint text-black rounded-lg font-semibold text-[10px] tracking-normal hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-mint/10"
                          >
                            COMMIT
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-700 font-bold tracking-normal">
                          {s.description}
                        </p>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#151b18]/95 backdrop-blur-2xl border-t border-white/5 px-6 py-5 flex justify-around items-center rounded-t-[36px] shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${
              activeTab === tab.id
                ? "text-brand-mint -translate-y-2"
                : "text-zinc-700"
            }`}
          >
            {tab.icon}
            <span className="text-[8px] font-semibold tracking-normal">
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-glow"
                className="h-1 w-6 bg-brand-mint rounded-full shadow-[0_0_15px_#71efb2]"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Modal: Add Money */}
      <AnimatePresence>
        {selectedUserForMoney && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass w-full max-w-md p-10 rounded-lg border-white/10 relative shadow-[0_0_100px_rgba(212,175,55,0.1)]"
            >
              <button
                onClick={() => setSelectedUserForMoney(null)}
                className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 rounded-lg bg-brand-mint/10 flex items-center justify-center border border-brand-mint/20 shadow-[inset_0_0_20px_rgba(212,175,55,0.05)]">
                  <DollarSign className="text-brand-mint" size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-normal text-white">
                    Adjust Portfolio
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-bold tracking-normal leading-relaxed">
                    Direct balance credit for <br />
                    <span className="text-brand-mint font-semibold">
                      {selectedUserForMoney.name}
                    </span>
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="00.00"
                      autoFocus
                      value={addMoneyAmt}
                      onChange={(e) => setAddMoneyAmt(e.target.value)}
                      className="w-full bg-black/50 border-2 border-white/5 rounded-lg py-7 px-8 text-4xl font-semibold text-center text-white focus:outline-none focus:border-brand-mint transition-all tracking-normal shadow-inner"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-800 font-semibold text-2xl pointer-events-none">
                      $
                    </div>
                  </div>
                  <p className="text-[9px] text-zinc-700 font-semibold tracking-normal">
                    Currency denominated in{" "}
                    {selectedUserForMoney.currency || "USD"}
                  </p>
                </div>

                <button
                  onClick={handleAddMoneySubmit}
                  className="w-full py-6 bg-brand-mint text-black rounded-lg font-semibold tracking-normal text-sm shadow-[0_20px_40px_rgba(212,175,55,0.2)] hover:scale-[1.03] active:scale-95 transition-all"
                >
                  Confirm Inject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Custom Message */}
      <AnimatePresence>
        {selectedUserForMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass w-full max-w-2xl p-8 md:p-12 rounded-lg border-white/10 relative overflow-y-auto max-h-[90vh] no-scrollbar shadow-[0_0_100px_rgba(59,130,246,0.1)]"
            >
              <button
                onClick={() => setSelectedUserForMsg(null)}
                className="absolute right-8 top-8 text-zinc-500 hover:text-white"
              >
                <X size={28} />
              </button>

              <div className="space-y-10">
                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                  <div className="w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Mail className="text-blue-500" size={30} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-normal">
                      Direct User Alert
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-bold tracking-normal mt-1">
                      Recipient:{" "}
                      <span className="text-white">
                        {selectedUserForMsg.email}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Templates Selector */}
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold tracking-normal text-zinc-500 ml-2">
                    Choose a message template
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-semibold tracking-normal hover:bg-brand-mint hover:text-black hover:border-brand-mint transition-all"
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold tracking-normal text-zinc-600 ml-2">
                      Email Subject
                    </label>
                    <input
                      value={msgSubject}
                      onChange={(e) => setMsgSubject(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-lg py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40 transition-all shadow-inner"
                      placeholder="Enter subject line..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold tracking-normal text-zinc-600 ml-2">
                      Message Header Title
                    </label>
                    <input
                      value={msgTitle}
                      onChange={(e) => setMsgTitle(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-lg py-4 px-6 text-xs font-bold text-white focus:outline-none focus:border-blue-500/40 transition-all shadow-inner"
                      placeholder="Main attention title..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold tracking-normal text-zinc-600 ml-2">
                      Detailed Message Body
                    </label>
                    <textarea
                      rows={6}
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-lg py-5 px-6 text-xs font-bold text-white leading-relaxed focus:outline-none focus:border-blue-500/40 transition-all shadow-inner no-scrollbar"
                      placeholder="Compose document body..."
                    />
                  </div>
                </div>

                <button
                  disabled={isSendingMsg}
                  onClick={handleSendMessage}
                  className="w-full py-6 bg-blue-600 text-white rounded-lg font-semibold tracking-normal text-xs shadow-[0_20px_50px_rgba(37,99,235,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSendingMsg ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                  {isSendingMsg ? "TRANSMITTING..." : "DISPATCH ALERT"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KYC Modal */}
      <AnimatePresence>
        {selectedUserForKyc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForKyc(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#111514] border border-white/10 rounded-lg p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button
                onClick={() => setSelectedUserForKyc(null)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-semibold tracking-normal mb-2">
                KYC Document <span className="text-blue-500">Review</span>
              </h3>
              <p className="text-zinc-500 text-[10px] font-bold tracking-normal mb-8">
                Verify documents for {selectedUserForKyc.name} (
                {selectedUserForKyc.email})
                <br />Phone: {selectedUserForKyc.phone || "Not provided"}
              </p>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 font-semibold tracking-normal pl-2">
                      Front ID
                    </p>
                    <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedUserForKyc.kycFront ? (
                        <img
                          src={selectedUserForKyc.kycFront}
                          alt="Front ID"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <p className="text-xs font-bold text-zinc-600">
                          Not Uploaded
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-zinc-500 font-semibold tracking-normal pl-2">
                      Back ID
                    </p>
                    <div className="w-full aspect-video bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                      {selectedUserForKyc.kycBack ? (
                        <img
                          src={selectedUserForKyc.kycBack}
                          alt="Back ID"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <p className="text-xs font-bold text-zinc-600">
                          Not Uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 max-w-sm mx-auto">
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-normal pl-2">
                    Selfie
                  </p>
                  <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                    {selectedUserForKyc.kycSelfie ? (
                      <img
                        src={selectedUserForKyc.kycSelfie}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <p className="text-xs font-bold text-zinc-600">
                        Not Uploaded
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleKycStatusUpdate("rejected")}
                    className="py-4 bg-red-600/10 text-red-500 border border-red-600/20 rounded-lg font-semibold text-xs tracking-normal hover:bg-red-600 hover:text-white transition-all"
                  >
                    Reject KYC
                  </button>
                  <button
                    onClick={() => handleKycStatusUpdate("verified")}
                    className="py-4 bg-green-600 text-white rounded-lg font-semibold text-xs tracking-normal hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
                  >
                    Approve KYC
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: AI Trader Control */}
      <AnimatePresence>
        {selectedUserForAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass w-full max-w-md p-10 rounded-lg border-white/10 relative shadow-[0_0_100px_rgba(168,85,247,0.1)]"
            >
              <button
                onClick={() => setSelectedUserForAI(null)}
                className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]">
                  <Cpu className="text-emerald-500" size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-normal text-white">
                    Trading assistant
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-bold tracking-normal leading-relaxed">
                    Trading settings for <br />
                    <span className="text-emerald-400 font-semibold">
                      {selectedUserForAI.name}
                    </span>
                  </p>
                </div>

                <div className="w-full space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-left">
                      <p className="text-[10px] font-semibold tracking-normal text-zinc-400">
                        Assistant status
                      </p>
                      <p className="text-xs font-bold text-white mt-1">
                        {aiActive ? "Online & Active" : "Offline / Standby"}
                      </p>
                    </div>
                    <button
                      onClick={() => setAiActive(!aiActive)}
                      className={`w-14 h-8 rounded-full transition-all relative ${aiActive ? "bg-emerald-600" : "bg-zinc-800"}`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${aiActive ? "right-1" : "left-1"}`}
                      />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-semibold text-zinc-500 tracking-normal block text-left ml-2">
                      Profit Amount ({selectedUserForAI.currency || "USD"})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={aiProfitAmt}
                        min="0.01"
                        step="0.01"
                        disabled={creditingProfit}
                        onChange={(e) => setAiProfitAmt(e.target.value)}
                        className="w-full bg-black/50 border-2 border-white/5 rounded-lg py-6 px-8 text-3xl font-semibold text-center text-white focus:outline-none focus:border-emerald-500 transition-all tracking-normal"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <button
                    onClick={handleUpdateAISettings}
                    disabled={creditingProfit}
                    className="py-5 bg-white/5 border border-white/10 text-white rounded-lg font-semibold tracking-normal text-[10px] hover:bg-white/10 transition-all"
                  >
                    Sync Config
                  </button>
                  <button
                    onClick={handleExecuteAIProfit}
                    disabled={creditingProfit}
                    className="py-5 bg-emerald-600 text-white rounded-lg font-semibold tracking-normal text-[10px] shadow-lg shadow-emerald-600/20 hover:scale-[1.03] active:scale-95 transition-all"
                  >
                    {creditingProfit ? "Crediting..." : "Add Profit"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modal: Withdrawal Code Generation */}
      <AnimatePresence>
        {selectedUserForWCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="glass w-full max-w-md p-10 rounded-lg border-white/10 relative shadow-[0_0_100px_rgba(6,182,212,0.1)]"
            >
              <button
                onClick={() => setSelectedUserForWCode(null)}
                className="absolute right-8 top-8 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={28} />
              </button>

              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-24 h-24 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <FileText className="text-cyan-500" size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold tracking-normal text-white">
                    Withdrawal Code
                  </h3>
                  <p className="text-[10px] text-zinc-600 font-bold tracking-normal leading-relaxed">
                    Assign code for <br />
                    <span className="text-cyan-400 font-semibold">
                      {selectedUserForWCode.name}
                    </span>
                  </p>
                </div>

                <div className="w-full space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={newWithdrawalCode}
                      onChange={(e) => setNewWithdrawalCode(e.target.value)}
                      className="w-full bg-black/50 border-2 border-white/5 rounded-lg py-7 px-8 text-2xl font-semibold text-center text-white focus:outline-none focus:border-cyan-500 transition-all tracking-normal shadow-inner"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-700 font-semibold tracking-normal">
                    Users need this to complete a withdrawal
                  </p>
                </div>

                <button
                  onClick={handleGenerateWithdrawalCode}
                  className="w-full py-6 bg-cyan-600 text-white rounded-lg font-semibold tracking-normal text-sm shadow-[0_20px_40px_rgba(6,182,212,0.2)] hover:scale-[1.03] active:scale-95 transition-all"
                >
                  Set Withdrawal Code
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashCard({
  label,
  value,
  color,
  desc,
}: {
  label: string;
  value: string | number;
  color: string;
  desc: string;
}) {
  const colorMap: any = {
    gold: "from-brand-mint/10 text-brand-mint border-brand-mint/20 shadow-brand-mint/5",
    blue: "from-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/5",
    green:
      "from-green-500/10 text-green-500 border-green-500/20 shadow-green-500/5",
  };

  return (
    <div
      className={`glass p-8 rounded-lg border-white/5 bg-gradient-to-br ${colorMap[color]} shadow-2xl space-y-4 group`}
    >
      <p className="text-[10px] font-semibold tracking-normal opacity-60 leading-none">
        {label}
      </p>
      <p className="text-4xl font-semibold tracking-normal leading-none">
        {value}
      </p>
      <p className="text-[9px] font-bold tracking-normal text-zinc-600 border-t border-white/5 pt-4">
        {desc}
      </p>
    </div>
  );
}

function ActionButton({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green:
      "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/30",
    red: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30",
    gold: "bg-brand-mint hover:brightness-110 text-black shadow-lg shadow-brand-mint/30",
    purple:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30",
  };

  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-lg transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${colorMap[color]}`}
    >
      {icon}
      <span className="text-xs font-semibold tracking-normal">{label}</span>
    </Link>
  );
}
