import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar,
  ScrollView, Animated, Pressable, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatJarvis, type CompanyKey, type TaskType } from '../lib/aiService';
import GlassPillNav from '../components/GlassPillNav';

// ─── Types ───────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'suggestion';
type ApprovalState = null | 'approved' | 'rejected';

interface JarvisMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: MsgType;
  impact?: string;
  approval?: ApprovalState;
  taskType?: TaskType;
  ts: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CYAN    = '#00D4FF';
const PURPLE  = '#6C63FF';
const GREEN   = '#00FFB2';
const BG      = '#00040F';
const CARD    = 'rgba(0,212,255,0.04)';
const BORDER  = 'rgba(0,212,255,0.12)';

const COMPANIES: { key: CompanyKey; label: string; icon: string; color: string }[] = [
  { key: 'dogrucan',    label: 'Doğrucan',    icon: '🏛', color: CYAN   },
  { key: 'ai_furniture',label: 'AI Furniture', icon: '🤖', color: PURPLE },
  { key: 'core',        label: 'Core',         icon: '◉',  color: GREEN  },
];

const TASKS: { key: TaskType; label: string }[] = [
  { key: 'general',      label: 'Genel'     },
  { key: 'sales',        label: 'Satış'     },
  { key: 'marketing',    label: 'Pazarlama' },
  { key: 'document',     label: 'Analiz'    },
  { key: 'architecture', label: 'Mimari'    },
  { key: 'code',         label: 'Kod'       },
];

const SESSION_KEY = (c: CompanyKey) => `jarvis_session_${c}`;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Typing Indicator ────────────────────────────────────────────────────────

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current,
                useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(d, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.delay(480 - i * 160),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.jarvisAvatar}><Text style={styles.jarvisAvatarText}>J</Text></View>
      <View style={styles.typingBubble}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d, transform: [{ translateY: d.interpolate({ inputRange: [0,1], outputRange: [0, -4] }) }] }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, onApprove, onReject, onEdit, companyColor }: {
  msg: JarvisMessage;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onEdit:    (id: string) => void;
  companyColor: string;
}) {
  if (msg.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  const isSuggestion = msg.type === 'suggestion';
  const approved   = msg.approval === 'approved';
  const rejected   = msg.approval === 'rejected';
  const pending    = msg.approval === null;

  return (
    <View style={styles.jarvisRow}>
      <View style={[styles.jarvisAvatar, { borderColor: companyColor + '60' }]}>
        <Text style={[styles.jarvisAvatarText, { color: companyColor }]}>J</Text>
      </View>
      <View style={[styles.jarvisBubble, isSuggestion && styles.suggestionBubble,
                    approved && styles.approvedBubble, rejected && styles.rejectedBubble]}>
        {isSuggestion && (
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <Text style={[styles.suggestionLabel, { color: companyColor }]}>ÖNERİ</Text>
          </View>
        )}
        <Text style={styles.jarvisText}>{msg.content}</Text>
        {isSuggestion && msg.impact && (
          <View style={styles.impactBadge}>
            <Text style={styles.impactText}>📈 {msg.impact}</Text>
          </View>
        )}
        {isSuggestion && pending && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(msg.id)}>
              <Text style={styles.approveBtnText}>✓ Onayla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(msg.id)}>
              <Text style={styles.editBtnText}>✎ Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(msg.id)}>
              <Text style={styles.rejectBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {approved && <Text style={styles.statusText}>✓ Onaylandı</Text>}
        {rejected && <Text style={[styles.statusText, { color: '#FF4444' }]}>✕ Reddedildi</Text>}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function JarvisScreen() {
  const insets = useSafeAreaInsets();

  const [company,  setCompany ] = useState<CompanyKey>('dogrucan');
  const [taskType, setTaskType] = useState<TaskType>('general');
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [input,    setInput   ] = useState('');
  const [loading,  setLoading ] = useState(false);
  const [sessionId,setSessionId] = useState<string>('');

  const listRef  = useRef<FlatList>(null);
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const inputRef = useRef<TextInput>(null);

  const companyInfo = COMPANIES.find(c => c.key === company)!;

  // Glow pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 2000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  // Load or create session per company
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY(company)).then(sid => {
      if (sid) {
        setSessionId(sid);
      } else {
        const newSid = uid();
        AsyncStorage.setItem(SESSION_KEY(company), newSid);
        setSessionId(newSid);
      }
    });

    // Welcome message per company
    setMessages([{
      id: uid(),
      role: 'assistant',
      content: company === 'dogrucan'
        ? 'Merhaba Emekcan. Doğrucan Mobilya komuta merkezine hoş geldin. Şubeler, satış verileri, personel veya kritik sorunlar hakkında ne öğrenmek istiyorsun?'
        : company === 'ai_furniture'
        ? 'AI Furniture X komuta merkezine hoş geldin. Strateji, teknik mimari veya yatırımcı ilişkileri hakkında konuşalım.'
        : 'Jarvis burada. Ne yapmamı istersin?',
      type: 'text',
      ts: Date.now(),
    }]);
  }, [company]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(async (text?: string, asSuggestion = false) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: JarvisMessage = {
      id: uid(), role: 'user', content, type: 'text', ts: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await chatJarvis({
        messages: [...history, { role: 'user', content }],
        company,
        taskType,
        sessionId,
      });

      const assistantMsg: JarvisMessage = {
        id: uid(),
        role: 'assistant',
        content: res.content,
        type: asSuggestion ? 'suggestion' : 'text',
        impact: asSuggestion ? 'Hesaplanıyor...' : undefined,
        approval: asSuggestion ? null : undefined,
        taskType,
        ts: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      scrollToBottom();
    } catch (e) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: '⚠ Bağlantı hatası. Lütfen tekrar dene.',
        type: 'text', ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, company, taskType, sessionId]);

  const handleSuggestion = useCallback(() => {
    const prompt = input.trim() ||
      (company === 'dogrucan'
        ? 'Şu an odaklanmam gereken en kritik iş önerin nedir? Somut ve ölçülebilir olsun.'
        : 'Bu hafta yapabileceğim en yüksek etkili stratejik adım nedir?');
    handleSend(prompt, true);
  }, [input, company, handleSend]);

  const approve = useCallback((id: string) =>
    setMessages(p => p.map(m => m.id === id ? { ...m, approval: 'approved' } : m)), []);
  const reject  = useCallback((id: string) =>
    setMessages(p => p.map(m => m.id === id ? { ...m, approval: 'rejected' } : m)), []);
  const editMsg = useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg) { setInput(msg.content); inputRef.current?.focus(); }
  }, [messages]);

  const switchCompany = useCallback((c: CompanyKey) => {
    if (c === company) return;
    setCompany(c);
  }, [company]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={[styles.orb, { opacity: glowAnim, shadowColor: companyInfo.color }]} />
          <Text style={[styles.headerTitle, { color: companyInfo.color }]}>JARVIS</Text>
          <Text style={styles.headerSub}>AI Command Center</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: companyInfo.color }]} />
      </View>

      {/* ── Company Switcher ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  style={styles.companyScroll} contentContainerStyle={styles.companyContent}>
        {COMPANIES.map(c => {
          const active = c.key === company;
          return (
            <Pressable key={c.key} onPress={() => switchCompany(c.key)}
                       style={[styles.companyPill, active && { backgroundColor: c.color + '22', borderColor: c.color }]}>
              <Text style={styles.companyIcon}>{c.icon}</Text>
              <Text style={[styles.companyLabel, active && { color: c.color, fontWeight: '700' }]}>
                {c.label}
              </Text>
              {active && <View style={[styles.companyActiveDot, { backgroundColor: c.color }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 140}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              onApprove={approve}
              onReject={reject}
              onEdit={editMsg}
              companyColor={companyInfo.color}
            />
          )}
          ListFooterComponent={loading ? <TypingDots /> : null}
        />

        {/* ── Task Type Pills ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    style={styles.taskScroll} contentContainerStyle={styles.taskContent}>
          {TASKS.map(t => {
            const active = t.key === taskType;
            return (
              <Pressable key={t.key} onPress={() => setTaskType(t.key)}
                         style={[styles.taskPill, active && { backgroundColor: companyInfo.color + '22', borderColor: companyInfo.color }]}>
                <Text style={[styles.taskLabel, active && { color: companyInfo.color }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Input Area ── */}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.suggestionFab} onPress={handleSuggestion}>
            <Text style={[styles.suggestionFabText, { color: companyInfo.color }]}>⚡</Text>
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Bir şey sor veya komut ver..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: companyInfo.color }, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}>
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <GlassPillNav />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG },
  flex:  { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orb: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: CYAN,
    shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, elevation: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 4 },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, marginTop: 2 },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },

  // Company switcher
  companyScroll:  { maxHeight: 52, flexGrow: 0 },
  companyContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  companyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 50,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  companyIcon:      { fontSize: 14 },
  companyLabel:     { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  companyActiveDot: { width: 5, height: 5, borderRadius: 3, marginLeft: 2 },

  // Messages
  messageList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, gap: 16 },

  // User bubble
  userRow:    { alignItems: 'flex-end' },
  userBubble: {
    maxWidth: '80%', backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  userText: { color: '#E8F8FF', fontSize: 14, lineHeight: 20 },

  // Jarvis bubble
  jarvisRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  jarvisAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  jarvisAvatarText: { fontSize: 13, fontWeight: '800', color: CYAN },
  jarvisBubble: {
    flex: 1, backgroundColor: CARD,
    borderWidth: 1, borderColor: BORDER,
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingVertical: 12, paddingHorizontal: 14, gap: 8,
  },
  jarvisText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 21 },

  // Suggestion card
  suggestionBubble: {
    borderColor: 'rgba(108,99,255,0.35)', backgroundColor: 'rgba(108,99,255,0.06)',
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suggestionIcon:   { fontSize: 14 },
  suggestionLabel:  { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  impactBadge: {
    backgroundColor: 'rgba(0,255,178,0.08)', borderWidth: 1,
    borderColor: 'rgba(0,255,178,0.2)', borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start',
  },
  impactText: { color: '#00FFB2', fontSize: 12, fontWeight: '600' },
  actionRow:  { flexDirection: 'row', gap: 8, marginTop: 4 },
  approveBtn: {
    flex: 1, backgroundColor: 'rgba(0,255,178,0.12)', borderWidth: 1,
    borderColor: 'rgba(0,255,178,0.3)', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  approveBtnText: { color: '#00FFB2', fontSize: 12, fontWeight: '700' },
  editBtn: {
    flex: 1, backgroundColor: 'rgba(0,212,255,0.1)', borderWidth: 1,
    borderColor: BORDER, borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  editBtnText: { color: CYAN, fontSize: 12, fontWeight: '600' },
  rejectBtn: {
    width: 38, backgroundColor: 'rgba(255,68,68,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.25)', borderRadius: 10,
    paddingVertical: 8, alignItems: 'center',
  },
  rejectBtnText: { color: '#FF4444', fontSize: 12, fontWeight: '700' },
  approvedBubble: { borderColor: 'rgba(0,255,178,0.3)', backgroundColor: 'rgba(0,255,178,0.04)' },
  rejectedBubble: { borderColor: 'rgba(255,68,68,0.2)', opacity: 0.6 },
  statusText:     { fontSize: 11, color: '#00FFB2', fontWeight: '600', marginTop: 2 },

  // Typing
  typingWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingVertical: 14, paddingHorizontal: 18,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: CYAN },

  // Task pills
  taskScroll:   { maxHeight: 46, flexGrow: 0, marginBottom: 4 },
  taskContent:  { paddingHorizontal: 16, gap: 6, alignItems: 'center' },
  taskPill: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 50,
    borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
  },
  taskLabel: { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },

  // Input
  inputArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingBottom: 90, paddingTop: 8,
  },
  suggestionFab: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,212,255,0.08)', borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestionFabText: { fontSize: 18 },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: BORDER, borderRadius: 16,
    paddingVertical: 10, paddingHorizontal: 14,
    color: '#fff', fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { fontSize: 18, color: '#000', fontWeight: '800' },
});
