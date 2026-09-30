import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileSpreadsheet, 
  Mail, 
  Users, 
  MessageSquare, 
  Video, 
  X, 
  Sparkles, 
  Chrome, 
  LogOut, 
  Trash2, 
  Send, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  connectGoogleWorkspace, 
  getCachedToken, 
  clearCachedToken,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  createSpreadsheet,
  appendRowToSheet,
  getSpreadsheetValues,
  sendGmail,
  listGmailMessages,
  listGoogleContacts,
  createGoogleContact,
  listChatSpaces,
  sendChatMessage
} from '../services/googleWorkspace';
import { auth } from '../services/firebase';

interface WorkspaceHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceHub: React.FC<WorkspaceHubProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'sheets' | 'gmail' | 'contacts' | 'chat'>('calendar');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Calendar States
  const [events, setEvents] = useState<any[]>([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [newEventAttendees, setNewEventAttendees] = useState('');
  const [createMeetLink, setCreateMeetLink] = useState(true);

  // Sheets States
  const [sheetId, setSheetId] = useState('');
  const [sheetTitle, setSheetTitle] = useState('WeLink Leads & Subscribers');
  const [sampleRows, setSampleRows] = useState<any[]>([]);

  // Gmail States
  const [emails, setEmails] = useState<any[]>([]);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  // Contacts States
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactFirst, setContactFirst] = useState('');
  const [contactLast, setContactLast] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Chat States
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  // Tab Specific Errors State (to gracefully handle disabled services like Google Chat)
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});

  // Local Storage Leads (to sync and display)
  const [localLeads, setLocalLeads] = useState<any[]>([]);

  useEffect(() => {
    // Load local form submissions (leads)
    const stored = localStorage.getItem('welink_leads');
    if (stored) {
      try {
        setLocalLeads(JSON.parse(stored));
      } catch {
        // Fallback
      }
    } else {
      // Seed some demo leads if none exist so the user can try exporting them!
      const demoLeads = [
        { name: 'أحمد محمود', email: 'ahmed@example.com', phone: '0501234567', date: new Date().toLocaleDateString('ar-EG') },
        { name: 'سارة العتيبي', email: 'sara@example.com', phone: '0559876543', date: new Date().toLocaleDateString('ar-EG') },
        { name: 'محمد حسن', email: 'mohamed@example.com', phone: '0543210987', date: new Date().toLocaleDateString('ar-EG') },
      ];
      localStorage.setItem('welink_leads', JSON.stringify(demoLeads));
      setLocalLeads(demoLeads);
    }

    // Monitor Firebase Auth connection state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && getCachedToken()) {
        setIsConnected(true);
        setCurrentUser(user);
        loadWorkspaceData();
      } else {
        setIsConnected(false);
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const loadWorkspaceData = async () => {
    if (!getCachedToken()) return;
    setIsLoading(true);
    // Clear previous error for the active tab
    setTabErrors(prev => ({ ...prev, [activeTab]: '' }));
    try {
      if (activeTab === 'calendar') {
        const data = await listCalendarEvents();
        setEvents(data);
      } else if (activeTab === 'sheets') {
        // Try getting loaded spreadsheet if configured
        const savedSheetId = localStorage.getItem('welink_sheet_id');
        if (savedSheetId) {
          setSheetId(savedSheetId);
          const values = await getSpreadsheetValues(savedSheetId, 'Sheet1!A1:D10');
          setSampleRows(values);
        }
      } else if (activeTab === 'gmail') {
        const data = await listGmailMessages();
        setEmails(data);
      } else if (activeTab === 'contacts') {
        const data = await listGoogleContacts();
        setContacts(data);
      } else if (activeTab === 'chat') {
        const data = await listChatSpaces();
        setSpaces(data);
        if (data.length > 0) setSelectedSpace(data[0].name);
      }
    } catch (err: any) {
      console.error('Workspace API Error:', err);
      let errMsg = err.message || JSON.stringify(err);
      if (errMsg.includes('Google Chat is turned off') || errMsg.includes('chat.googleapis.com')) {
        errMsg = 'GOOGLE_CHAT_DISABLED';
      }
      setTabErrors(prev => ({ ...prev, [activeTab]: errMsg }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      loadWorkspaceData();
    }
  }, [activeTab, isConnected]);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await connectGoogleWorkspace();
      setIsConnected(true);
      setCurrentUser(res.user);
      showStatus('success', 'تم توصيل حساب Google Workspace بنجاح فائق! 🎉');
    } catch (err: any) {
      showStatus('error', 'تعذر الاتصال بـ Google: ' + (err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    clearCachedToken();
    setIsConnected(false);
    setCurrentUser(null);
    showStatus('success', 'تم قطع اتصال Google Workspace بنجاح.');
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  // Create Calendar Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventStart || !newEventEnd) {
      showStatus('error', 'يرجى تعبئة جميع الحقول الأساسية للحدث.');
      return;
    }
    setIsLoading(true);
    try {
      const attendees = newEventAttendees ? newEventAttendees.split(',').map(s => s.trim()) : [];
      const res = await createCalendarEvent({
        summary: newEventTitle,
        start: new Date(newEventStart).toISOString(),
        end: new Date(newEventEnd).toISOString(),
        attendees,
        createMeetLink
      });
      showStatus('success', `تم حجز الحدث بنجاح! ${res.hangoutLink ? 'رابط Google Meet متاح.' : ''}`);
      setNewEventTitle('');
      setNewEventStart('');
      setNewEventEnd('');
      setNewEventAttendees('');
      // Reload
      loadWorkspaceData();
    } catch (err: any) {
      showStatus('error', 'حدث خطأ أثناء حجز الحدث: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Calendar Event
  const handleDeleteEvent = async (id: string, summary: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحدث "${summary}" من تقويم Google الخاص بك؟`)) return;
    setIsLoading(true);
    try {
      await deleteCalendarEvent(id);
      showStatus('success', 'تم حذف الحدث بنجاح.');
      loadWorkspaceData();
    } catch (err: any) {
      showStatus('error', 'تعذر حذف الحدث.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Google Sheet
  const handleCreateSheet = async () => {
    setIsLoading(true);
    try {
      const res = await createSpreadsheet(sheetTitle);
      setSheetId(res.spreadsheetId);
      localStorage.setItem('welink_sheet_id', res.spreadsheetId);
      
      // Initialize header row
      await appendRowToSheet(res.spreadsheetId, 'Sheet1!A1:D1', ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'تاريخ التسجيل']);
      
      showStatus('success', 'تم إنشاء ملف Google Sheet وتجهيزه بنجاح! 📊');
      loadWorkspaceData();
    } catch (err: any) {
      showStatus('error', 'تعذر إنشاء الجدول.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync leads/subscribers to Google Sheet
  const handleSyncToSheet = async () => {
    if (!sheetId) {
      showStatus('error', 'يرجى إنشاء جدول Google Sheet أولاً للربط والمزامنة.');
      return;
    }
    if (localLeads.length === 0) {
      showStatus('error', 'لا توجد بيانات مسجلين جديدة للمزامنة حالياً.');
      return;
    }
    setIsLoading(true);
    try {
      for (const lead of localLeads) {
        await appendRowToSheet(sheetId, 'Sheet1!A2', [lead.name, lead.email, lead.phone || '', lead.date]);
      }
      showStatus('success', `تمت مزامنة تصدير عدد (${localLeads.length}) مسجلين لـ Google Sheets بنجاح تام! 📤`);
      
      // Reload sheet values
      const values = await getSpreadsheetValues(sheetId, 'Sheet1!A1:D10');
      setSampleRows(values);
    } catch (err: any) {
      showStatus('error', 'خطأ أثناء مزامنة البيانات: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Send Email with Gmail
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailTo || !mailSubject || !mailBody) {
      showStatus('error', 'يرجى تعبئة كافة حقول الإرسال للبريد.');
      return;
    }
    setIsLoading(true);
    try {
      await sendGmail({
        to: mailTo,
        subject: mailSubject,
        body: `<div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border-radius: 12px; border: 1px solid #f0f0f0;">
                <h2 style="color: #0071e3;">رسالة مرسلة من منصة WeLink 🌐</h2>
                <p>${mailBody.replace(/\n/g, '<br/>')}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <small style="color: #999;">تم الإرسال بأمان عبر تكامل WeLink مع Gmail.</small>
               </div>`
      });
      showStatus('success', 'تم إرسال البريد الإلكتروني عبر Gmail بنجاح باهر! ✉️');
      setMailTo('');
      setMailSubject('');
      setMailBody('');
    } catch (err: any) {
      showStatus('error', 'فشل إرسال البريد: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create Contact
  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFirst || !contactLast) {
      showStatus('error', 'الاسم الأول واسم العائلة مطلوبان.');
      return;
    }
    setIsLoading(true);
    try {
      await createGoogleContact({
        firstName: contactFirst,
        lastName: contactLast,
        email: contactEmail || undefined,
        phone: contactPhone || undefined
      });
      showStatus('success', 'تمت إضافة جهة الاتصال إلى Google Contacts بنجاح! 👥');
      setContactFirst('');
      setContactLast('');
      setContactEmail('');
      setContactPhone('');
      loadWorkspaceData();
    } catch (err: any) {
      showStatus('error', 'فشل إضافة جهة الاتصال: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Form Lead to Contact
  const handleSyncLeadToContact = async (lead: any) => {
    setIsLoading(true);
    try {
      const names = lead.name.split(' ');
      const firstName = names[0] || 'مسجل';
      const lastName = names.slice(1).join(' ') || 'WeLink';
      await createGoogleContact({
        firstName,
        lastName,
        email: lead.email,
        phone: lead.phone || undefined
      });
      showStatus('success', `تم ربط ومزامنة المسجل "${lead.name}" في جهات اتصال Google بنجاح!`);
      loadWorkspaceData();
    } catch (err: any) {
      showStatus('error', 'تعذر إضافة جهة الاتصال.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Google Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace || !chatMessage) {
      showStatus('error', 'الرجاء اختيار مساحة وكتابة الرسالة.');
      return;
    }
    setIsLoading(true);
    try {
      await sendChatMessage(selectedSpace, chatMessage);
      showStatus('success', 'تم إرسال التنبيه إلى مساحة Google Chat بنجاح! 💬');
      setChatMessage('');
    } catch (err: any) {
      showStatus('error', 'فشل إرسال رسالة المحادثة.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-end bg-black/40 backdrop-blur-xs text-right" dir="rtl">
      {/* Overlay Close Area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Drawer Hub Panel */}
      <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-left border-r border-black/[0.08]">
        
        {/* Header Strip */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-l from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🌐
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-1.5">
                تكاملات Google Workspace
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">اتصال مباشر</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">اربط جميع خدمات Google لصفحة WeLink الخاصة بك</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-all active:scale-95 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Workspace Connection State */}
        <div className="p-4 bg-gray-50 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          {isConnected && currentUser ? (
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" className="w-9 h-9 rounded-full border border-black/10" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm font-sans">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
              )}
              <div className="text-right">
                <div className="text-xs font-bold text-neutral-800 leading-tight">
                  متصل بـ: {currentUser.displayName || 'حساب Google'}
                </div>
                <div className="text-[10px] text-neutral-500 leading-none mt-0.5">{currentUser.email}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">الرجاء ربط وتفويض صلاحيات Google للبدء</span>
            </div>
          )}

          <div>
            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer select-none"
              >
                <LogOut size={12} />
                <span>قطع اتصال الحساب</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={isLoading}
                className="text-xs font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 select-none"
              >
                <Chrome size={13} />
                <span>ربط وتفويض الحساب بـ Google ⚡</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications and Alerts */}
        {statusMsg && (
          <div className={`p-3 text-center text-xs font-medium flex items-center justify-center gap-2 transition-all ${
            statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-red-50 text-red-800 border-b border-red-100'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Work Area when Connected */}
        {isConnected ? (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar Navigation for Workspace Tabs */}
            <div className="w-44 border-l border-neutral-100 bg-neutral-50/50 p-2 flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'calendar' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Calendar size={14} />
                <span>التقويم والميتينج</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sheets')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'sheets' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>جداول البيانات</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gmail')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'gmail' 
                    ? 'bg-red-500 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Mail size={14} />
                <span>بريد جيميل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contacts')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'contacts' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Users size={14} />
                <span>جهات الاتصال</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-right ${
                  activeTab === 'chat' 
                    ? 'bg-orange-500 text-white shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <MessageSquare size={14} />
                <span>محادثات جوجل</span>
              </button>

              {/* Summary Banner inside tabs */}
              <div className="mt-auto p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-[10px] text-blue-800 leading-normal font-medium">
                <Sparkles size={12} className="inline mr-1 text-blue-600" />
                تكامل WeLink يربط صفحاتك تلقائياً بقاعدة بياناتك وخدمات قوقل في آن واحد!
              </div>
            </div>

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* LOADING SKELETON overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-xs font-bold text-neutral-600">
                    <Loader2 size={24} className="animate-spin text-blue-600" />
                    <span>جاري الاتصال بـ Google API...</span>
                  </div>
                </div>
              )}

              {/* TAB 1: CALENDAR & MEET */}
              {activeTab === 'calendar' && (
                <div className="space-y-5 animate-fade-in text-right">
                  {/* Scheduling Form */}
                  <form onSubmit={handleCreateEvent} className="bg-neutral-50/60 border border-neutral-100 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">📅 حجز موعد / حدث جديد:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">عنوان الحدث</label>
                        <input
                          type="text"
                          value={newEventTitle}
                          onChange={(e) => setNewEventTitle(e.target.value)}
                          placeholder="مثلاً: استشارة مع العميل..."
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">البريد الإلكتروني للضيف (اختياري)</label>
                        <input
                          type="email"
                          value={newEventAttendees}
                          onChange={(e) => setNewEventAttendees(e.target.value)}
                          placeholder="client@example.com"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">تاريخ ووقت البدء</label>
                        <input
                          type="datetime-local"
                          value={newEventStart}
                          onChange={(e) => setNewEventStart(e.target.value)}
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">تاريخ ووقت الانتهاء</label>
                        <input
                          type="datetime-local"
                          value={newEventEnd}
                          onChange={(e) => setNewEventEnd(e.target.value)}
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={createMeetLink}
                          onChange={(e) => setCreateMeetLink(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded-md border-neutral-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                          <Video size={13} className="text-emerald-600" />
                          إنشاء وتوليد رابط Google Meet تلقائياً
                        </span>
                      </label>

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        إضافة للتقويم
                      </button>
                    </div>
                  </form>

                  {/* Upcoming events list */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-neutral-800">الأحداث القادمة في تقويم Google الخاص بك:</h3>
                    {events.length === 0 ? (
                      <div className="text-xs text-neutral-400 py-6 text-center border border-dashed border-neutral-200 rounded-2xl bg-gray-50/30">
                        لا توجد مواعيد قريبة محجوزة.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {events.map((event) => (
                          <div key={event.id} className="bg-white border border-neutral-100 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 text-right">
                            <div className="flex-1">
                              <div className="text-xs font-bold text-neutral-800">{event.summary}</div>
                              <div className="text-[10px] text-neutral-500 mt-1">
                                📅 البدء: {new Date(event.start?.dateTime || event.start?.date).toLocaleString('ar-EG')}
                              </div>
                              {event.hangoutLink && (
                                <a 
                                  href={event.hangoutLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100/60"
                                >
                                  <Video size={10} />
                                  <span>انضمام لاجتماع Google Meet 🟢</span>
                                </a>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(event.id, event.summary)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                              title="حذف الموعد"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: GOOGLE SHEETS */}
              {activeTab === 'sheets' && (
                <div className="space-y-5 animate-fade-in text-right">
                  {/* Create Sheet Form */}
                  <div className="bg-neutral-50/60 border border-neutral-100 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">📊 إنشاء وجدول Google Sheet لتجميع المسجلين:</h3>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sheetTitle}
                        onChange={(e) => setSheetTitle(e.target.value)}
                        placeholder="اسم ملف قوقل شيت..."
                        className="flex-1 text-xs px-3 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleCreateSheet}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        إنشاء جدول جديد
                      </button>
                    </div>

                    {sheetId && (
                      <div className="text-[10px] text-gray-500 bg-white border border-neutral-100 p-2.5 rounded-xl break-all">
                        <span className="font-bold text-neutral-700">الملف المرتبط الحالي:</span> {sheetId}
                        <div className="mt-1 flex justify-end">
                          <a 
                            href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#0071e3] hover:underline font-bold"
                          >
                            عرض وتعديل في Google Sheets ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Synchronizer Leads Section */}
                  <div className="space-y-3 bg-white border border-neutral-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-neutral-800">بيانات المسجلين الجدد في WeLink:</h3>
                      {sheetId && (
                        <button
                          type="button"
                          onClick={handleSyncToSheet}
                          className="bg-[#0071e3] hover:bg-[#0077ed] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-xs active:scale-95"
                        >
                          <ArrowLeftRight size={11} />
                          <span>تصدير ومزامنة للجدول 📤</span>
                        </button>
                      )}
                    </div>

                    {localLeads.length === 0 ? (
                      <div className="text-xs text-neutral-400 py-6 text-center border border-dashed border-neutral-200 rounded-xl bg-gray-50/10">
                        لا يوجد مسجلون جدد حتى الآن.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {localLeads.map((lead, i) => (
                          <div key={i} className="flex justify-between items-center text-xs p-2 bg-neutral-50 rounded-lg hover:bg-neutral-100/75 border border-neutral-100">
                            <div>
                              <span className="font-bold text-neutral-800">{lead.name}</span>
                              <span className="text-[10px] text-neutral-500 mr-2 font-mono">({lead.email})</span>
                            </div>
                            <div className="text-[10px] text-neutral-400">{lead.date}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: GMAIL EMAIL */}
              {activeTab === 'gmail' && (
                <div className="space-y-5 animate-fade-in text-right">
                  {/* Email composer */}
                  <form onSubmit={handleSendEmail} className="bg-neutral-50/60 border border-neutral-100 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">✉️ صياغة وإرسال بريد إلكتروني فوري عبر Gmail:</h3>
                    
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500">المرسل إليه (إيميل العميل)</label>
                      <input
                        type="email"
                        required
                        value={mailTo}
                        onChange={(e) => setMailTo(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500 text-left"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500">عنوان الرسالة</label>
                      <input
                        type="text"
                        required
                        value={mailSubject}
                        onChange={(e) => setMailSubject(e.target.value)}
                        placeholder="مثلاً: مرحباً بك في WeLink..."
                        className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500">نص الرسالة</label>
                      <textarea
                        required
                        rows={4}
                        value={mailBody}
                        onChange={(e) => setMailBody(e.target.value)}
                        placeholder="اكتب رسالتك وتفاصيل العرض للعميل هنا..."
                        className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500 leading-normal"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        <span>إرسال البريد الآن</span>
                      </button>
                    </div>
                  </form>

                  {/* Gmail History */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-neutral-800">صندوق البريد الأخير (أحدث رسائل):</h3>
                    {emails.length === 0 ? (
                      <div className="text-xs text-neutral-400 py-6 text-center border border-dashed border-neutral-200 rounded-2xl bg-gray-50/30">
                        لا توجد رسائل مستلمة حديثة.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {emails.map((msg: any) => {
                          const headers = msg.payload?.headers || [];
                          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'بدون موضوع';
                          const from = headers.find((h: any) => h.name === 'From')?.value || 'مجهول';
                          return (
                            <div key={msg.id} className="bg-white border border-neutral-100 rounded-xl p-3 shadow-xs text-right">
                              <div className="text-xs font-bold text-neutral-800">{subject}</div>
                              <div className="text-[10px] text-neutral-500 mt-1">المرسل: {from}</div>
                              <div className="text-[9px] text-neutral-400 mt-0.5">{msg.snippet}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACTS */}
              {activeTab === 'contacts' && (
                <div className="space-y-5 animate-fade-in text-right">
                  {/* Create Contact */}
                  <form onSubmit={handleCreateContact} className="bg-neutral-50/60 border border-neutral-100 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">👥 إضافة جهة اتصال جديدة لـ Google Contacts:</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">الاسم الأول</label>
                        <input
                          type="text"
                          required
                          value={contactFirst}
                          onChange={(e) => setContactFirst(e.target.value)}
                          placeholder="الاسم الأول"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">اسم العائلة</label>
                        <input
                          type="text"
                          required
                          value={contactLast}
                          onChange={(e) => setContactLast(e.target.value)}
                          placeholder="العائلة"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">البريد الإلكتروني</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="example@mail.com"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">رقم الجوال</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="05xxxxxxx"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        حفظ في جهات الاتصال
                      </button>
                    </div>
                  </form>

                  {/* Sync list buttons */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-neutral-800">مزامنة سريعة لجهات الاتصال من مسجلي الموقع:</h3>
                    {localLeads.length === 0 ? (
                      <div className="text-xs text-neutral-400 py-3 text-center border border-dashed border-neutral-200 rounded-xl">
                        لا توجد بيانات مسجلين جديدة.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {localLeads.map((lead, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl">
                            <div>
                              <span className="font-bold text-neutral-800">{lead.name}</span>
                              <span className="text-[10px] text-neutral-500 mr-2 font-mono">({lead.email})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSyncLeadToContact(lead)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                            >
                              إضافة لجهات الاتصال ➕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CHAT */}
              {activeTab === 'chat' && (
                <div className="space-y-5 animate-fade-in text-right">
                  {tabErrors.chat === 'GOOGLE_CHAT_DISABLED' ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-right space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                        <AlertCircle size={18} />
                        <span>خدمة Google Chat غير مفعّلة في حسابك!</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        يبدو أن ميزة <strong>Google Chat</strong> معطلة حالياً لحساب Google الخاص بك. لاستخدام الـ Chat API، يجب أولاً تشغيل خدمة Google Chat من إعدادات حسابك أو من خلال مسؤول النظام (Administrator).
                      </p>
                      <div className="bg-white border border-amber-100 p-3.5 rounded-xl text-xs text-neutral-600 space-y-1.5">
                        <p className="font-bold text-neutral-800">خطوات تفعيل الخدمة:</p>
                        <p>1. تأكد من تفعيل الدردشة عبر زيارة الرابط: <a href="https://chat.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5">Chat.google.com ↗</a></p>
                        <p>2. إذا كنت تستخدم بريد مؤسسي (Google Workspace)، اطلب من مدير النظام تمكين Google Chat للمستخدمين.</p>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        💡 <strong>ملاحظة هامة:</strong> بقية الخدمات وتكاملات WeLink (كالتقويم والاجتماعات، جداول Google Sheets ومزامنة المسجلين، بريد Gmail، وجهات الاتصال) <strong>تعمل بالكامل وبأعلى كفاءة</strong> ولا تتأثر مطلقاً بهذا التعطيل!
                      </p>
                    </div>
                  ) : (
                    /* Send chat form */
                    <form onSubmit={handleSendChat} className="bg-neutral-50/60 border border-neutral-100 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">💬 إرسال إشعارات وتنبيهات لمساحات Google Chat:</h3>
                      
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">اختر مساحة المحادثة (Active Space)</label>
                        {spaces.length === 0 ? (
                          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-1 font-medium">
                            ⚠️ لم نجد مساحات دردشة نشطة في تطبيق Google Chat بحسابك حتى الآن. يرجى إنشاء مساحة في Chat.google.com أولاً.
                          </div>
                        ) : (
                          <select
                            value={selectedSpace}
                            onChange={(e) => setSelectedSpace(e.target.value)}
                            className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500 cursor-pointer"
                          >
                            {spaces.map(s => (
                              <option key={s.name} value={s.name}>{s.displayName || s.name}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-500">نص التنبيه المراد إرساله للمساحة</label>
                        <textarea
                          required
                          rows={3}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="مثلاً: تنبيه جديد! قام العميل بالاشتراك في صفحتك لخدمات WeLink ⚡"
                          className="w-full text-xs px-3 py-2 mt-1 bg-white border border-neutral-200 rounded-xl outline-none focus:border-blue-500 leading-normal"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={spaces.length === 0}
                          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                          إرسال الإشعار
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

            </div>

          </div>
        ) : (
          /* Locked State / Introduction */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center text-4xl mb-6 shadow-sm border border-blue-100/50">
              ⚡
            </div>
            <h3 className="text-base font-bold text-neutral-800 mb-2">
              تكامل غير محدود مع Google Workspace لزيادة إنتاجيتك!
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed mb-6">
              اربط تطبيقك بمشروع Google Cloud الخاص بك لإدارة الحجز والجدولة، وإضافة جهات الاتصال، ومزامنة بيانات العملاء المشتركين في جداول البيانات، وإرسال تنبيهات جماعية ببريد جيميل فوري ومباشر مع زوار صفحة WeLink!
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer select-none"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Chrome size={15} />
              )}
              <span>توصيل حساب Google Workspace ⚡</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
