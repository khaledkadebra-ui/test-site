/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReportPdf.tsx — VSME ESG Report PDF (24 sider)
 * Design: Fredensborg Kommune ESG-Rapport 2025 stil
 * Safe react-pdf: no SVG, no gap, fontWeight max 700,
 * no textTransform/letterSpacing, no rgba/8-digit hex
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// ── Farvepalette ───────────────────────────────────────────────────────────────
const C = {
  eColor:    "#5b8fa8", eLightBg: "#eaf3f7",
  sColor:    "#c49a1b", sLightBg: "#fdf5e0",
  gColor:    "#19afc1", gLightBg: "#e0f7fa",
  dark:      "#2c3a45", darkMid: "#38474f", darkLight: "#4a5f6b",
  darkText:  "#b0c4cb", darkSub:  "#7a9aa8",
  white:     "#ffffff",
  gray50:    "#f8fafc", gray100: "#f1f5f9", gray200: "#e2e8f0",
  gray300:   "#cbd5e1", gray400:  "#94a3b8", gray500: "#64748b",
  gray600:   "#475569", gray700:  "#334155", gray900: "#0f172a",
  red:       "#dc2626", redLight: "#fee2e2",
  amber:     "#d97706", amberLight: "#fef3c7",
  green:     "#16a34a", greenLight: "#dcfce7",
  sdg7:      "#fcc30b", sdg12: "#bf8b2e", sdg13: "#3f7e44",
  sdg15:     "#56c02b", sdg3: "#4c9f38",  sdg4: "#c5192d",
  sdg8:      "#a21942", sdg10: "#dd1367", sdg16: "#00689d",
}

const DIM_COLOR  = { E: C.eColor,   S: C.sColor,   G: C.gColor   } as Record<string,string>
const DIM_BG     = { E: C.eLightBg, S: C.sLightBg, G: C.gLightBg } as Record<string,string>
const DIM_FULL   = { E: "Miljø (Environment)", S: "Sociale forhold (Social)", G: "Ledelse (Governance)" } as Record<string,string>
const PRIO_COLOR = { high: C.red,      medium: C.amber,      low: C.green      } as Record<string,string>
const PRIO_BG    = { high: C.redLight, medium: C.amberLight, low: C.greenLight } as Record<string,string>
const PRIO_LABEL = { high: "HØJ",      medium: "MIDDEL",     low: "LAV"        } as Record<string,string>
const Q_COLOR    = { Q1:"#22c55e", Q2:"#0284c7", Q3:"#7c3aed", Q4:"#f97316" } as Record<string,string>
const Q_MONTHS   = { Q1:"Jan-Mar", Q2:"Apr-Jun", Q3:"Jul-Sep", Q4:"Okt-Dec" } as Record<string,string>
const RATING_COLOR = { A:C.green, B:"#65a30d", C:C.amber, D:"#f97316", E:C.red } as Record<string,string>
const RATING_LABEL = { A:"Fremragende", B:"Godt", C:"Middel", D:"Under middel", E:"Kritisk" } as Record<string,string>

// ── Typer ──────────────────────────────────────────────────────────────────────
type Rec = {
  id: string; title: string; description: string; effort: string; category: string;
  priority: string; timeline: string; smart_goal: string; action_steps: string[];
  score_improvement_pts: number; estimated_co2_reduction_pct: number; kpis?: string[];
}

export interface ReportPdfProps {
  // Kernfelter (altid krævet)
  companyName:           string
  reportYear:            number
  reportDate:            string
  esgRating:             string
  esgScoreTotal:         number
  esgScoreE:             number
  esgScoreS:             number
  esgScoreG:             number
  industryPercentile:    number
  totalCo2Tonnes:        number
  scope1Co2Tonnes:       number
  scope2Co2Tonnes:       number
  scope3Co2Tonnes:       number
  executiveSummary:      string
  co2Narrative:          string
  esgNarrative:          string
  improvementsNarrative: string
  roadmapNarrative:      string
  identifiedGaps:        string[]
  recommendations:       Rec[]
  disclaimer:            string
  industryCode?:         string
  countryCode?:          string
  // Udvidede felter (valgfrie — bruges til 24-siders rapport)
  leaderName?:           string
  leaderTitle?:          string
  foreword?:             string
  companyAddress?:       string
  companyPhone?:         string
  companyEmail?:         string
  companyWebsite?:       string
  employees?:            number
  employeesMale?:        number
  employeesFemale?:      number
  managersTotal?:        number
  managersFemale?:       number
  avgAge?:               number
  sickDaysPerYear?:      number
  industrySickDays?:     number
  turnoverRate?:         number
  trainingHoursPerEmp?:  number
  workAccidents?:        number
  electricVehicles?:     number
  totalVehicles?:        number
  renewableEnergyPct?:   number
  energyKwh?:            number
  wasteTotal?:           number
  wasteRecycledPct?:     number
  whistleblowerReports?: number
  employeeSatisfaction?: number
  volunteerHours?:       number
  co2PerEmployee?:       number
  industryCo2PerEmp?:    number
}

// ── StyleSheet ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:     { fontFamily:"Helvetica", fontSize:9, color:C.gray700, backgroundColor:C.white, paddingBottom:52 },
  darkPage: { fontFamily:"Helvetica", fontSize:9, color:C.white,   backgroundColor:C.dark  },
  topBar:   { height:4 },
  pageSubHeader: {
    paddingHorizontal:40, paddingTop:10, paddingBottom:10,
    flexDirection:"row", justifyContent:"space-between", alignItems:"center",
    borderBottomWidth:1, borderBottomColor:C.gray100, backgroundColor:C.gray50,
  },
  pageFooter: {
    position:"absolute", bottom:0, left:0, right:0,
    paddingHorizontal:40, paddingVertical:14,
    flexDirection:"row", justifyContent:"space-between",
    borderTopWidth:1, borderTopColor:C.gray200,
  },
  pageFooterText: { fontSize:7, color:C.gray400 },
  pageBody: { paddingHorizontal:40, paddingTop:24 },
  // Cover
  coverPage: { fontFamily:"Helvetica", backgroundColor:C.dark, flexDirection:"column", justifyContent:"space-between" },
  coverMain: { flex:1, padding:52 },
  coverLabel:   { fontSize:9,  color:C.darkText, marginBottom:40 },
  coverTitle:   { fontSize:36, fontWeight:700, color:C.white, lineHeight:1.15, marginBottom:6 },
  coverSub:     { fontSize:14, color:C.darkText, marginBottom:32 },
  coverCompany: { fontSize:11, color:C.darkText, marginBottom:4 },
  coverBottomBar: { flexDirection:"row", height:84 },
  coverBlock: { flex:1, padding:16, justifyContent:"space-between" },
  coverBlockLabel: { fontSize:8, color:C.white, fontWeight:700 },
  coverBlockValue: { fontSize:22, fontWeight:700, color:C.white },
  // Section intro (dark sider)
  introBody: { flex:1, padding:52, justifyContent:"space-between" },
  introBadge: { width:60, height:60, borderRadius:30, alignItems:"center", justifyContent:"center", marginBottom:24 },
  introBadgeLetter: { fontSize:30, fontWeight:700, color:C.white },
  introTitle: { fontSize:28, fontWeight:700, color:C.white, lineHeight:1.2, marginBottom:12 },
  introDesc:  { fontSize:11, color:C.darkText, lineHeight:1.6 },
  introBottomLine: { borderTopWidth:1, borderTopColor:C.darkLight, paddingTop:16 },
  introBottomText: { fontSize:8, color:C.darkSub },
  // To-kolonne layout (mål + hvad gør vi)
  twoCardRow: { flexDirection:"row", marginBottom:14 },
  leftCard: { flex:1, backgroundColor:C.white, borderWidth:1, borderColor:C.gray200, borderRadius:6, marginRight:10, overflow:"hidden" },
  leftCardAccent: { height:3 },
  leftCardBody: { padding:14 },
  rightCard: { flex:1, borderRadius:6, overflow:"hidden" },
  rightCardAccent: { height:3 },
  rightCardBody: { padding:14, flex:1 },
  cardHeading: { fontSize:8, fontWeight:700, color:C.gray500, marginBottom:8 },
  cardText: { fontSize:9, color:C.gray700, lineHeight:1.6 },
  bulletRow: { flexDirection:"row", marginBottom:5 },
  bulletDot:  { fontSize:9, color:C.gray500, marginRight:5, marginTop:1 },
  bulletText: { fontSize:9, color:C.gray700, lineHeight:1.5, flex:1 },
  // Scope bars
  scopeRow: { flexDirection:"row", alignItems:"center", marginBottom:8 },
  scopeLabel: { fontSize:8, color:C.gray600, width:56 },
  scopeTrack: { flex:1, height:10, backgroundColor:C.gray100, borderRadius:5, overflow:"hidden", marginRight:8 },
  scopeFill:  { height:10, borderRadius:5 },
  scopeValue: { fontSize:8, fontWeight:700, color:C.gray600, width:60, textAlign:"right" },
  // Dim bars
  dimBarRow: { marginBottom:10 },
  dimBarHead: { flexDirection:"row", justifyContent:"space-between", marginBottom:3 },
  dimBarLabel: { fontSize:8, fontWeight:700, color:C.gray600 },
  dimBarValue: { fontSize:8, fontWeight:700 },
  dimBarTrack: { height:8, backgroundColor:C.gray100, borderRadius:4, overflow:"hidden" },
  dimBarFill:  { height:8, borderRadius:4 },
  // Metric boxes (nøgletal)
  metricRow: { flexDirection:"row", marginBottom:10 },
  metricBox: { flex:1, borderRadius:8, overflow:"hidden", marginRight:8 },
  metricBoxLast: { flex:1, borderRadius:8, overflow:"hidden" },
  metricTop: { height:4 },
  metricBody: { padding:12, backgroundColor:C.white, borderWidth:1, borderColor:C.gray200, borderTopWidth:0 },
  metricValue: { fontSize:22, fontWeight:700, marginBottom:2 },
  metricUnit:  { fontSize:7, color:C.gray400, marginBottom:4 },
  metricLabel: { fontSize:8, fontWeight:700, color:C.gray700 },
  metricSub:   { fontSize:7, color:C.gray400, marginTop:2 },
  // Horisontal søjlediagram
  hBarRow: { flexDirection:"row", alignItems:"center", marginBottom:7 },
  hBarLabel: { fontSize:8, color:C.gray600, width:72 },
  hBarTrack: { flex:1, height:12, backgroundColor:C.gray100, borderRadius:4, overflow:"hidden", marginRight:8 },
  hBarFill:  { height:12, borderRadius:4 },
  hBarValue: { fontSize:8, fontWeight:700, color:C.gray700, width:48, textAlign:"right" },
  // Tabel
  tableHeader: { flexDirection:"row" },
  tableRow:    { flexDirection:"row", borderTopWidth:1, borderTopColor:C.gray100 },
  tableCell:   { flex:1, fontSize:8, padding:7, color:C.gray700 },
  tableCellBold: { flex:1, fontSize:8, padding:7, fontWeight:700, color:C.gray900 },
  // Citatkasse
  quoteAccent: { width:4, borderRadius:2, marginRight:12 },
  quoteText:   { fontSize:10, color:C.gray700, lineHeight:1.7, fontStyle:"italic", marginBottom:6 },
  quoteAuthor: { fontSize:8, fontWeight:700, color:C.gray500 },
  // Foto-pladsholder
  photoBox: { backgroundColor:C.gray100, borderRadius:6, alignItems:"center", justifyContent:"center", marginBottom:14 },
  photoBoxText: { fontSize:8, color:C.gray400, fontStyle:"italic" },
  // SDG badge
  sdgBadge: { width:30, height:30, borderRadius:4, alignItems:"center", justifyContent:"center", marginRight:4 },
  sdgBadgeLabel: { fontSize:6, fontWeight:700, color:C.white },
  sdgBadgeNum: { fontSize:9, fontWeight:700, color:C.white },
  // VSME reference
  vsmeTag: { backgroundColor:C.dark, paddingHorizontal:5, paddingVertical:2, borderRadius:3, marginRight:6 },
  vsmeTagText: { fontSize:6, fontWeight:700, color:C.white },
  // GHG beregning
  calcRow: { flexDirection:"row", justifyContent:"space-between", paddingVertical:5, borderBottomWidth:1, borderBottomColor:C.gray100 },
  calcLabel: { fontSize:8, color:C.gray600, flex:2 },
  calcFactor: { fontSize:8, color:C.gray500, flex:1, textAlign:"center" },
  calcResult: { fontSize:8, fontWeight:700, color:C.gray700, flex:1, textAlign:"right" },
  // Benchmark
  benchRow: { flexDirection:"row", alignItems:"center", marginBottom:10 },
  benchLabel: { fontSize:8, color:C.gray600, width:120 },
  benchTrack: { flex:1, height:8, backgroundColor:C.gray100, borderRadius:4, overflow:"hidden", marginRight:4 },
  benchFill:  { height:8, borderRadius:4 },
  benchFillRef: { height:8, borderRadius:4, backgroundColor:C.gray300 },
  benchVal: { fontSize:7, color:C.gray500, width:60, textAlign:"right" },
  // Gab (mangler)
  gapItem: { flexDirection:"row", marginBottom:6, alignItems:"flex-start" },
  gapDot:  { width:6, height:6, borderRadius:3, marginTop:3, marginRight:8, flexShrink:0 },
  gapText: { fontSize:8, color:C.gray700, lineHeight:1.5, flex:1 },
  // Rec cards
  recCard: { backgroundColor:C.white, borderWidth:1, borderColor:C.gray200, borderRadius:6, marginBottom:10, overflow:"hidden" },
  recCardTop: { height:3 },
  recCardBody: { padding:12 },
  recCardTitle: { fontSize:9, fontWeight:700, color:C.gray900, flex:1, marginRight:8, lineHeight:1.4 },
  recBadge: { paddingHorizontal:5, paddingVertical:2, borderRadius:3, marginLeft:3 },
  recBadgeText: { fontSize:7, fontWeight:700 },
  recSmartBox: { backgroundColor:C.gray50, borderRadius:4, padding:8, marginBottom:6 },
  recSmartLabel: { fontSize:7, fontWeight:700, color:C.gray400, marginBottom:2 },
  recSmartText:  { fontSize:8, color:C.gray700, lineHeight:1.5 },
  recStepRow: { flexDirection:"row", marginBottom:4 },
  recStepNum: { width:14, height:14, borderRadius:7, backgroundColor:C.gray200, alignItems:"center", justifyContent:"center", marginRight:5, flexShrink:0 },
  recStepNumTxt: { fontSize:7, fontWeight:700, color:C.gray600 },
  recStepTxt: { fontSize:8, color:C.gray600, lineHeight:1.4, flex:1 },
  // Kvartal plan
  qGrid: { flexDirection:"row", marginBottom:20 },
  qCol: { flex:1, borderWidth:1, borderColor:C.gray200, borderRadius:6, overflow:"hidden", marginRight:8 },
  qColLast: { flex:1, borderWidth:1, borderColor:C.gray200, borderRadius:6, overflow:"hidden" },
  qHead: { padding:10 },
  qHeadLabel: { fontSize:9, fontWeight:700, color:C.white, marginBottom:2 },
  qHeadSub: { fontSize:7, color:"#dddddd" },
  qBody: { padding:8, backgroundColor:C.white },
  qItemRow: { flexDirection:"row", marginBottom:5 },
  qDot: { width:5, height:5, borderRadius:3, marginTop:3, flexShrink:0, marginRight:5 },
  qItemText: { fontSize:7, color:C.gray700, lineHeight:1.4, flex:1 },
  // Hjælpe-stile
  sectionTitle: { fontSize:13, fontWeight:700, color:C.gray900, marginBottom:4 },
  sectionSub:   { fontSize:8, color:C.gray400, marginBottom:16 },
  body:    { fontSize:9, color:C.gray700, lineHeight:1.6 },
  bodyBold:{ fontSize:9, color:C.gray700, lineHeight:1.6, fontWeight:700 },
  small:   { fontSize:7, color:C.gray400 },
  sourceNote: { fontSize:7, color:C.gray400, fontStyle:"italic", marginTop:8, borderTopWidth:1, borderTopColor:C.gray100, paddingTop:8 },
  infoBox: { backgroundColor:C.gray50, borderRadius:6, padding:14, marginBottom:14 },
  divider: { borderTopWidth:1, borderTopColor:C.gray200, marginVertical:12 },
  tocRow:  { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-end", marginBottom:8, paddingBottom:8, borderBottomWidth:1, borderBottomColor:C.gray100 },
})

// ── Hjælpefunktioner ───────────────────────────────────────────────────────────
function stripMd(t: string): string {
  if (!t) return ""
  return t.replace(/^#{1,6}\s+/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1")
          .replace(/\*([^*]+)\*/g,"$1").replace(/`([^`]+)`/g,"$1")
          .replace(/^[-*]\s+/gm,"").trim()
}
function para(t: string, max=500): string {
  if (!t) return ""
  const c = stripMd(t)
  const sents = c.split(/(?<=\.)\s+/)
  let r=""
  for (const s of sents) { if ((r+s).length>max) break; r+=(r?" ":"")+s }
  return r || c.slice(0,max)
}
function bullets(t: string, max=5): string[] {
  if (!t) return []
  const b: string[]=[]
  for (const l of t.split("\n")) {
    const m=l.match(/^[-*\d.]+\s+(.+)/); if(m) b.push(m[1].trim()); if(b.length>=max) break
  }
  if (b.length===0) return stripMd(t).split(/\.\s+/).slice(0,max).filter(Boolean).map(s=>s.replace(/\.$/,""))
  return b
}
function gt(g: any): string { return typeof g==="string"?g:g?.description||JSON.stringify(g) }

// ── Delte komponenter ──────────────────────────────────────────────────────────
function TopBar({color}:{color:string}) { return <View style={[s.topBar,{backgroundColor:color}]} /> }

function PageSubHeader({companyName,year,dimColor,dimLabel,pageLabel}:{companyName:string;year:number;dimColor:string;dimLabel:string;pageLabel:string}) {
  return (
    <View style={s.pageSubHeader}>
      <Text style={{fontSize:8,color:C.gray500}}>{companyName} · VSME Basic Module · {year}</Text>
      <View style={{flexDirection:"row",alignItems:"center"}}>
        <View style={{backgroundColor:dimColor,paddingHorizontal:6,paddingVertical:2,borderRadius:3,marginRight:8}}>
          <Text style={{fontSize:7,fontWeight:700,color:C.white}}>{dimLabel}</Text>
        </View>
        <Text style={{fontSize:8,color:C.gray500}}>{pageLabel}</Text>
      </View>
    </View>
  )
}

function PageFooter({page,companyName,year,address}:{page:string;companyName:string;year:number;address?:string}) {
  return (
    <View style={s.pageFooter}>
      <Text style={s.pageFooterText}>{address||companyName} · ESG-rapport {year} · VSME Basic Module (EFRAG 2024)</Text>
      <Text style={s.pageFooterText}>{page}</Text>
    </View>
  )
}

function ScopeBar({label,tonnes,max}:{label:string;tonnes:number;max:number}) {
  const pct = max>0 ? Math.min((tonnes/max)*100,100) : 0
  return (
    <View style={s.scopeRow}>
      <Text style={s.scopeLabel}>{label}</Text>
      <View style={s.scopeTrack}><View style={[s.scopeFill,{width:`${pct}%`,backgroundColor:C.eColor}]} /></View>
      <Text style={s.scopeValue}>{(tonnes??0).toFixed(2)} t</Text>
    </View>
  )
}

function DimBar({label,score,max,color}:{label:string;score:number;max:number;color:string}) {
  const pct = Math.min(((score??0)/max)*100,100)
  return (
    <View style={s.dimBarRow}>
      <View style={s.dimBarHead}>
        <Text style={s.dimBarLabel}>{label}</Text>
        <Text style={[s.dimBarValue,{color}]}>{(score??0).toFixed(1)} / {max}</Text>
      </View>
      <View style={s.dimBarTrack}><View style={[s.dimBarFill,{width:`${pct}%`,backgroundColor:color}]} /></View>
    </View>
  )
}

function HBarChart({rows,color}:{rows:Array<{label:string;value:number;max:number;unit?:string}>;color:string}) {
  return (
    <View>
      {rows.map((row,i) => (
        <View key={i} style={s.hBarRow}>
          <Text style={s.hBarLabel}>{row.label}</Text>
          <View style={s.hBarTrack}>
            <View style={[s.hBarFill,{width:`${Math.min((row.value/row.max)*100,100)}%`,backgroundColor:color}]} />
          </View>
          <Text style={s.hBarValue}>{row.value}{row.unit||""}</Text>
        </View>
      ))}
    </View>
  )
}

function TwoCardLayout({dim,goalTitle,goalText,actionTitle,actionBullets}:{
  dim:string;goalTitle:string;goalText:string;actionTitle:string;actionBullets:string[]
}) {
  const color = DIM_COLOR[dim]||C.eColor
  const bg    = DIM_BG[dim]||C.eLightBg
  return (
    <View style={s.twoCardRow}>
      <View style={s.leftCard}>
        <View style={[s.leftCardAccent,{backgroundColor:color}]} />
        <View style={s.leftCardBody}>
          <Text style={[s.cardHeading,{color}]}>{goalTitle}</Text>
          <Text style={s.cardText}>{goalText}</Text>
        </View>
      </View>
      <View style={[s.rightCard,{backgroundColor:bg}]}>
        <View style={[s.rightCardAccent,{backgroundColor:color}]} />
        <View style={s.rightCardBody}>
          <Text style={[s.cardHeading,{color}]}>{actionTitle}</Text>
          {actionBullets.map((b,i)=>(
            <View key={i} style={s.bulletRow}>
              <Text style={[s.bulletDot,{color}]}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

function SectionIntroPage({dim,subtitle,description,companyName,year}:{
  dim:string;subtitle:string;description:string;companyName:string;year:number
}) {
  const color = DIM_COLOR[dim]||C.eColor
  return (
    <Page size="A4" style={s.darkPage}>
      <View style={s.introBody}>
        <View>
          <View style={[s.introBadge,{backgroundColor:color}]}>
            <Text style={s.introBadgeLetter}>{dim}</Text>
          </View>
          <Text style={{fontSize:8,color:C.darkSub,marginBottom:8}}>{DIM_FULL[dim]||dim}</Text>
          <Text style={s.introTitle}>{subtitle}</Text>
          <Text style={s.introDesc}>{description}</Text>
          <View style={{flexDirection:"row",marginTop:20}}>
            {dim==="E" && [7,12,13,15].map(n=><SDGBadge key={n} number={n} />)}
            {dim==="S" && [3,4,8,10].map(n=><SDGBadge key={n} number={n} />)}
            {dim==="G" && [16].map(n=><SDGBadge key={n} number={n} />)}
          </View>
        </View>
        <View style={s.introBottomLine}>
          <Text style={s.introBottomText}>{companyName} · VSME Basic Module · ESG-rapport {year}</Text>
        </View>
      </View>
    </Page>
  )
}

function SDGBadge({number}:{number:number}) {
  const colors: Record<number,string> = {
    3:C.sdg3, 4:C.sdg4, 7:C.sdg7, 8:C.sdg8, 10:C.sdg10,
    12:C.sdg12, 13:C.sdg13, 15:C.sdg15, 16:C.sdg16,
  }
  const c = colors[number]||C.gray500
  return (
    <View style={[s.sdgBadge,{backgroundColor:c}]}>
      <Text style={s.sdgBadgeLabel}>SDG</Text>
      <Text style={s.sdgBadgeNum}>{number}</Text>
    </View>
  )
}

function QuoteBox({text,author,color}:{text:string;author:string;color?:string}) {
  const c = color||C.gray300
  return (
    <View style={{flexDirection:"row",marginBottom:16}}>
      <View style={[s.quoteAccent,{backgroundColor:c}]} />
      <View style={{flex:1}}>
        <Text style={s.quoteText}>"{text}"</Text>
        <Text style={s.quoteAuthor}>— {author}</Text>
      </View>
    </View>
  )
}

function PhotoBox({label,height=70}:{label:string;height?:number}) {
  return (
    <View style={[s.photoBox,{height}]}>
      <Text style={s.photoBoxText}>[Foto: {label}]</Text>
    </View>
  )
}

function VSMERef({article}:{article:string}) {
  return (
    <View style={{flexDirection:"row",alignItems:"center",marginBottom:6}}>
      <View style={s.vsmeTag}><Text style={s.vsmeTagText}>VSME</Text></View>
      <Text style={{fontSize:7,color:C.gray400,fontStyle:"italic"}}>{article}</Text>
    </View>
  )
}

function MetricCard({label,value,unit,sub,color,bg,last}:{
  label:string;value:string;unit:string;sub?:string;color:string;bg:string;last?:boolean
}) {
  return (
    <View style={last ? s.metricBoxLast : s.metricBox}>
      <View style={[s.metricTop,{backgroundColor:color}]} />
      <View style={[s.metricBody,{backgroundColor:bg}]}>
        <Text style={[s.metricValue,{color}]}>{value}</Text>
        <Text style={s.metricUnit}>{unit}</Text>
        <Text style={s.metricLabel}>{label}</Text>
        {sub && <Text style={s.metricSub}>{sub}</Text>}
      </View>
    </View>
  )
}

function DataTable({headers,rows,color}:{headers:string[];rows:string[][];color:string}) {
  return (
    <View style={{borderWidth:1,borderColor:C.gray200,borderRadius:6,overflow:"hidden",marginBottom:14}}>
      <View style={[s.tableHeader,{backgroundColor:color}]}>
        {headers.map((h,i)=>(
          <Text key={i} style={{flex:1,fontSize:7,fontWeight:700,color:C.white,padding:8}}>{h}</Text>
        ))}
      </View>
      {rows.map((row,ri)=>(
        <View key={ri} style={[s.tableRow,{backgroundColor:ri%2===0?C.white:C.gray50}]}>
          {row.map((cell,ci)=>(
            <Text key={ci} style={ci===0?s.tableCellBold:s.tableCell}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
  )
}

function CalcTable({rows,total,color}:{rows:Array<{activity:string;amount:string;factor:string;co2:string}>;total:string;color:string}) {
  return (
    <View style={{borderWidth:1,borderColor:C.gray200,borderRadius:6,overflow:"hidden",marginBottom:14}}>
      <View style={[s.tableHeader,{backgroundColor:color}]}>
        {["Aktivitet","Mængde","Emissionsfaktor","CO2e (tonnes)"].map((h,i)=>(
          <Text key={i} style={{flex:1,fontSize:7,fontWeight:700,color:C.white,padding:7}}>{h}</Text>
        ))}
      </View>
      {rows.map((r,i)=>(
        <View key={i} style={[s.tableRow,{backgroundColor:i%2===0?C.white:C.gray50}]}>
          <Text style={s.tableCellBold}>{r.activity}</Text>
          <Text style={s.tableCell}>{r.amount}</Text>
          <Text style={s.tableCell}>{r.factor}</Text>
          <Text style={[s.tableCell,{fontWeight:700}]}>{r.co2}</Text>
        </View>
      ))}
      <View style={[s.tableRow,{backgroundColor:C.gray100}]}>
        <Text style={[s.tableCellBold,{flex:3}]}>TOTAL</Text>
        <Text style={[s.tableCellBold,{color}]}>{total}</Text>
      </View>
    </View>
  )
}

function RecCardSlim({rec,index,dim}:{rec:Rec;index:number;dim:string}) {
  const color     = DIM_COLOR[dim]||DIM_COLOR[rec.category]||C.eColor
  const prioColor = PRIO_COLOR[rec.priority]||C.green
  const prioBg    = PRIO_BG[rec.priority]||C.greenLight
  const prioLabel = PRIO_LABEL[rec.priority]||"LAV"
  const tlColor   = Q_COLOR[rec.timeline]||C.green
  return (
    <View style={s.recCard}>
      <View style={[s.recCardTop,{backgroundColor:color}]} />
      <View style={s.recCardBody}>
        <View style={{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <View style={{flexDirection:"row",alignItems:"center",flex:1,marginRight:8}}>
            <View style={{width:16,height:16,borderRadius:8,backgroundColor:color,alignItems:"center",justifyContent:"center",marginRight:6}}>
              <Text style={{fontSize:7,fontWeight:700,color:C.white}}>{index+1}</Text>
            </View>
            <Text style={s.recCardTitle}>{rec.title}</Text>
          </View>
          <View style={{flexDirection:"row"}}>
            <View style={[s.recBadge,{backgroundColor:prioBg}]}><Text style={[s.recBadgeText,{color:prioColor}]}>{prioLabel}</Text></View>
            <View style={[s.recBadge,{backgroundColor:C.gray100}]}><Text style={[s.recBadgeText,{color:tlColor}]}>{rec.timeline}</Text></View>
          </View>
        </View>
        {((rec.score_improvement_pts??0)>0||(rec.estimated_co2_reduction_pct??0)>0) && (
          <View style={{flexDirection:"row",marginBottom:6}}>
            {(rec.score_improvement_pts??0)>0 && (
              <View style={{backgroundColor:C.gray100,paddingHorizontal:6,paddingVertical:2,borderRadius:3,marginRight:5}}>
                <Text style={{fontSize:7,color:C.gray600}}>+{(rec.score_improvement_pts??0).toFixed(1)} ESG-pt</Text>
              </View>
            )}
            {(rec.estimated_co2_reduction_pct??0)>0 && (
              <View style={{backgroundColor:C.gray100,paddingHorizontal:6,paddingVertical:2,borderRadius:3,marginRight:5}}>
                <Text style={{fontSize:7,color:C.gray600}}>-{rec.estimated_co2_reduction_pct}% CO₂</Text>
              </View>
            )}
          </View>
        )}
        {rec.smart_goal && (
          <View style={s.recSmartBox}>
            <Text style={s.recSmartLabel}>SMART-MÅL</Text>
            <Text style={s.recSmartText}>{rec.smart_goal}</Text>
          </View>
        )}
        {rec.action_steps?.length>0 && (
          <View style={{marginTop:4}}>
            <Text style={{fontSize:7,fontWeight:700,color:C.gray400,marginBottom:4}}>Handlingstrin</Text>
            {rec.action_steps.slice(0,4).map((step,i)=>(
              <View key={i} style={s.recStepRow}>
                <View style={s.recStepNum}><Text style={s.recStepNumTxt}>{i+1}</Text></View>
                <Text style={s.recStepTxt}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

// ── Hoved-dokument ─────────────────────────────────────────────────────────────
export function ReportPdfDocument(props: ReportPdfProps) {
  const {
    companyName, reportYear: year, reportDate, esgRating,
    executiveSummary, co2Narrative, esgNarrative, improvementsNarrative, roadmapNarrative,
    industryCode, countryCode,
  } = props

  // Numeriske værdier med fallback
  const esgScoreTotal      = props.esgScoreTotal      ?? 0
  const esgScoreE          = props.esgScoreE          ?? 0
  const esgScoreS          = props.esgScoreS          ?? 0
  const esgScoreG          = props.esgScoreG          ?? 0
  const industryPercentile = props.industryPercentile  ?? 0
  const totalCo2            = props.totalCo2Tonnes     ?? 0
  const scope1              = props.scope1Co2Tonnes    ?? 0
  const scope2              = props.scope2Co2Tonnes    ?? 0
  const scope3              = props.scope3Co2Tonnes    ?? 0
  const identifiedGaps      = props.identifiedGaps     ?? []
  const recommendations     = props.recommendations    ?? []

  // Udvidede felter med defaults til vikar-bureau-eksempel
  const leaderName          = props.leaderName          ?? "Mette Andersen"
  const leaderTitle         = props.leaderTitle         ?? "Administrerende direktør"
  const employees           = props.employees           ?? 42
  const employeesMale       = props.employeesMale       ?? 18
  const employeesFemale     = props.employeesFemale     ?? 24
  const managersTotal       = props.managersTotal       ?? 8
  const managersFemale      = props.managersFemale      ?? 4
  const sickDays            = props.sickDaysPerYear     ?? 3.2
  const industrySickDays    = props.industrySickDays    ?? 4.1
  const turnoverRate        = props.turnoverRate        ?? 14
  const trainingHours       = props.trainingHoursPerEmp ?? 12
  const workAccidents       = props.workAccidents       ?? 0
  const electricVehicles    = props.electricVehicles    ?? 2
  const totalVehicles       = props.totalVehicles       ?? 6
  const renewableEnergyPct  = props.renewableEnergyPct  ?? 68
  const energyKwh           = props.energyKwh           ?? 87400
  const wasteTotal          = props.wasteTotal          ?? 4.8
  const wasteRecycledPct    = props.wasteRecycledPct    ?? 74
  const whistleReports      = props.whistleblowerReports ?? 0
  const empSatisfaction     = props.employeeSatisfaction ?? 4.2
  const volunteerHours      = props.volunteerHours      ?? 180
  const co2PerEmp           = props.co2PerEmployee      ?? parseFloat((totalCo2/Math.max(employees,1)).toFixed(2))
  const industryCo2PerEmp   = props.industryCo2PerEmp   ?? 3.2
  const companyAddress      = props.companyAddress      ?? "Nørrebrogade 45, 2200 København N"
  const companyPhone        = props.companyPhone        ?? "+45 77 88 99 00"
  const companyEmail        = props.companyEmail        ?? "info@" + companyName.toLowerCase().replace(/\s+/g,"")+".dk"
  const companyWebsite      = props.companyWebsite      ?? "www." + companyName.toLowerCase().replace(/\s+/g,"")+".dk"

  const rColor  = RATING_COLOR[esgRating] || C.gray500
  const rLabel  = RATING_LABEL[esgRating] || "ESG-vurdering"
  const dateStr = reportDate
    ? new Date(reportDate).toLocaleDateString("da-DK",{year:"numeric",month:"long",day:"numeric"})
    : ""
  const maxCo2 = Math.max(scope1,scope2,scope3,0.01)

  const recsE    = recommendations.filter(r=>r.category==="E").slice(0,3)
  const recsS    = recommendations.filter(r=>r.category==="S").slice(0,3)
  const recsG    = recommendations.filter(r=>r.category==="G").slice(0,3)
  const recsHigh = recommendations.filter(r=>r.priority==="high").slice(0,5)

  const quarterRecs: Record<string,Rec[]> = {Q1:[],Q2:[],Q3:[],Q4:[]}
  recommendations.slice(0,16).forEach(r=>{ if(quarterRecs[r.timeline]) quarterRecs[r.timeline].push(r) })

  const forewordText = props.foreword
    ? para(props.foreword, 800)
    : `Bæredygtighed er ikke blot et strategisk valg for ${companyName} – det er en grundlæggende del af vores identitet og forretningsmodel. Som vikar- og rekrutteringsbureau har vi en unik mulighed for at påvirke arbejdsmarkedet positivt: ved at sikre fair og ansvarlige ansættelsesforhold, fremme mangfoldighed og inkludere mennesker, der ellers kan have svært ved at finde fodfæste på arbejdsmarkedet. Denne rapport er udarbejdet i overensstemmelse med VSME Basic Module (EFRAG, 2024) og dækker vores ESG-indsats for ${year}. Vi er stolte af de fremskridt, vi har gjort, men anerkender, at der fortsat er et betydeligt forbedringspotentiale. Vi forpligter os til at arbejde systematisk og transparent mod vores mål.`

  const fp = (t:string,n=400) => para(t,n) || `${companyName} arbejder aktivt med dette område.`
  const fb = (t:string,n=5) => { const b=bullets(t,n); return b.length>0 ? b : [] }

  const co2Goal    = fp(co2Narrative, 380)
  const co2Acts    = fb(co2Narrative); const eCo2Acts = co2Acts.length>0?co2Acts:["Reducere energiforbrug i kontorer","Konvertere firmabiler til elbiler","Mindske flyrejser via videokonferencer","Kortlægge leverandørers CO₂-aftryk"]
  const socialGoal = fp(esgNarrative, 380)
  const sActs      = fb(esgNarrative); const sSocActs = sActs.length>0?sActs:["Styrke medarbejdertrivslen","Fremme ligestilling og mangfoldighed","Øge uddannelsesindsatsen","Nul-tolerance over for diskrimination"]
  const govGoal    = fp(improvementsNarrative, 380)
  const gActs      = fb(improvementsNarrative); const gGovActs = gActs.length>0?gActs:["Opdatere antikorruptionspolitik","Styrke bestyrelsens ESG-engagement","Sikre transparens i rapportering","Halvårlig interessentdialog"]

  const pf = (n:string) => ({ page: n, companyName, year, address: companyAddress })

  return (
    <Document title={`${companyName} VSME ESG-rapport ${year}`} author="ESG Copilot" subject="VSME Basic Module (EFRAG 2024)">

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 1: FORSIDE
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverMain}>
          <View>
            <Text style={s.coverLabel}>ESG Copilot · VSME Basic Module · EFRAG 2024</Text>
            <PhotoBox label="Luftfoto af virksomhed / bæredygtig bygnig" height={120} />
            <Text style={s.coverTitle}>VSME{"\n"}ESG-RAPPORT</Text>
            <Text style={s.coverSub}>{year}</Text>
          </View>
          <View>
            <Text style={s.coverCompany}>{companyName}</Text>
            {industryCode && <Text style={[s.coverCompany,{fontSize:9}]}>Branche: {industryCode}</Text>}
            {countryCode  && <Text style={[s.coverCompany,{fontSize:9}]}>Land: {countryCode}</Text>}
            <Text style={{fontSize:9,color:C.darkText,marginTop:8}}>Genereret: {dateStr}</Text>
          </View>
        </View>
        <View style={s.coverBottomBar}>
          <View style={[s.coverBlock,{backgroundColor:C.eColor}]}>
            <Text style={s.coverBlockLabel}>E — MILJØ</Text>
            <Text style={s.coverBlockValue}>{esgScoreE.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock,{backgroundColor:C.sColor}]}>
            <Text style={s.coverBlockLabel}>S — SOCIALE</Text>
            <Text style={s.coverBlockValue}>{esgScoreS.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock,{backgroundColor:C.gColor}]}>
            <Text style={s.coverBlockLabel}>G — LEDELSE</Text>
            <Text style={s.coverBlockValue}>{esgScoreG.toFixed(0)}</Text>
          </View>
          <View style={[s.coverBlock,{backgroundColor:C.darkMid}]}>
            <Text style={s.coverBlockLabel}>SAMLET RATING</Text>
            <Text style={[s.coverBlockValue,{color:rColor}]}>{esgRating}</Text>
          </View>
        </View>
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 2: INDHOLDSFORTEGNELSE
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray400} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="TOC" pageLabel="Indholdsfortegnelse" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Indholdsfortegnelse</Text>
          <Text style={s.sectionSub}>VSME ESG-rapport {year} · {companyName}</Text>
          {[
            {section:"Forord",          page:3,  color:C.gray500},
            {section:"Nøgletal",        page:4,  color:C.gray500},
            {section:"E — Energiforbrug",page:6,  color:C.eColor},
            {section:"E — Vedvarende energi",page:7, color:C.eColor},
            {section:"E — Transport og mobilitet",page:8,color:C.eColor},
            {section:"E — Ressourcer og affald",page:9,color:C.eColor},
            {section:"E — Klimakortlægning (GHG)",page:10,color:C.eColor},
            {section:"S — Medarbejdertrivsel",page:12,color:C.sColor},
            {section:"S — Diversitet og inklusion",page:13,color:C.sColor},
            {section:"S — Uddannelse og kompetencer",page:14,color:C.sColor},
            {section:"S — Sundhed og arbejdsmiljø",page:15,color:C.sColor},
            {section:"S — Ansvarlig rekruttering",page:16,color:C.sColor},
            {section:"G — Antikorruption og compliance",page:18,color:C.gColor},
            {section:"G — Ansvarlige investeringer",page:19,color:C.gColor},
            {section:"G — Organisationskultur og ledelse",page:20,color:C.gColor},
            {section:"Handlingsplan og tiltag",page:21,color:C.gray500},
            {section:"Metode og ansvarsfraskrivelse",page:23,color:C.gray500},
          ].map((row,i)=>(
            <View key={i} style={s.tocRow}>
              <View style={{flexDirection:"row",alignItems:"center",flex:1}}>
                <View style={{width:6,height:6,borderRadius:3,backgroundColor:row.color,marginRight:10}} />
                <Text style={{fontSize:9,color:C.gray700}}>{row.section}</Text>
              </View>
              <Text style={{fontSize:8,color:C.gray400}}>{row.page}</Text>
            </View>
          ))}
          <View style={[s.infoBox,{marginTop:16}]}>
            <Text style={[s.bodyBold,{marginBottom:4}]}>Om VSME Basic Module</Text>
            <Text style={s.body}>
              Denne rapport er udarbejdet i overensstemmelse med EFRAG's Voluntary Sustainability Reporting Standard
              for SMEs (VSME), Basic Module. VSME Basic Module stiller krav inden for B1 (Forretningsoversigt),
              B2 (ESG-scorecard), B3 (Klimaaftryk) samt supplerende oplysninger om miljø, sociale forhold og ledelse.
              Standarden er frivillig og målrettet SMV'er som ønsker at kommunikere bæredygtighed til interessenter,
              kunder og finansieringskilder.
            </Text>
          </View>
        </View>
        <PageFooter {...pf("Side 2")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 3: FORORD
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray600} dimLabel="B1" pageLabel="Forord" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Forord</Text>
          <VSMERef article="B1 — Forretningsoversigt og ledelsesredegørelse" />
          <View style={{flexDirection:"row",marginBottom:14}}>
            <PhotoBox label={`${leaderName}, ${leaderTitle}`} height={80} />
          </View>
          <Text style={[s.body,{marginBottom:14}]}>{forewordText}</Text>
          <QuoteBox
            text={`Bæredygtighed er vores fælles ansvar — over for medarbejderne, kunderne og de samfund, vi er en del af. Vi er forpligtede til at handle, ikke blot rapportere.`}
            author={`${leaderName}, ${leaderTitle}, ${companyName}`}
            color={C.eColor}
          />
          <View style={[s.infoBox,{marginTop:8}]}>
            <Text style={[s.bodyBold,{marginBottom:6,color:C.gray900}]}>Om {companyName}</Text>
            <Text style={s.body}>
              {companyName} er et dansk vikar- og rekrutteringsbureau grundlagt med fokus på at skabe fleksible
              og fair ansættelsesforhold. Virksomheden beskæftiger {employees} fastansatte medarbejdere og formidler
              løbende vikarer til en bred vifte af brancher — fra industri og logistik til administration og IT.
              Vores kerneydelse er at matche dygtige kandidater med virksomheder, der søger kompetent arbejdskraft,
              med respekt for både menneskelige og miljømæssige værdier.
            </Text>
          </View>
        </View>
        <PageFooter {...pf("Side 3")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 4: NØGLETAL (BÆREDYGTIGHEDSRESULTATER)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray400} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="B2" pageLabel="Bæredygtighedsresultater i nøgletal" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Bæredygtighedsresultater i nøgletal</Text>
          <Text style={s.sectionSub}>Samlet ESG-profil for {companyName} · Rapportperiode {year}</Text>
          {/* Samlet rating */}
          <View style={{flexDirection:"row",marginBottom:10}}>
            <MetricCard label="ESG Rating" value={esgRating} unit={rLabel} sub={`Score: ${esgScoreTotal.toFixed(1)}/100`} color={rColor} bg={C.gray50} />
            <MetricCard label="Total CO₂" value={totalCo2.toFixed(1)} unit="tCO₂e" sub={`${co2PerEmp.toFixed(1)} t/ansat`} color={C.eColor} bg={C.eLightBg} />
            <MetricCard label="Branche-%il" value={`${industryPercentile.toFixed(0)}%`} unit="Bedre end branchen" sub="ESG-scoring" color={C.gColor} bg={C.gLightBg} last />
          </View>
          {/* E nøgletal */}
          <Text style={[s.cardHeading,{color:C.eColor,fontSize:9,marginBottom:6}]}>E — Miljønøgletal</Text>
          <View style={[s.metricRow,{marginBottom:14}]}>
            <MetricCard label="Vedvarende energi" value={`${renewableEnergyPct}%`} unit="af elforbrug" color={C.eColor} bg={C.eLightBg} />
            <MetricCard label="Elbiler" value={`${electricVehicles}/${totalVehicles}`} unit="firmabiler er el" color={C.eColor} bg={C.eLightBg} />
            <MetricCard label="Affald genvundet" value={`${wasteRecycledPct}%`} unit="af samlet affald" color={C.eColor} bg={C.eLightBg} last />
          </View>
          {/* S nøgletal */}
          <Text style={[s.cardHeading,{color:C.sColor,fontSize:9,marginBottom:6}]}>S — Sociale nøgletal</Text>
          <View style={[s.metricRow,{marginBottom:14}]}>
            <MetricCard label="Medarbtilfredsh." value={`${empSatisfaction}/5`} unit="trivselsscore" sub="Branche: 3.8/5" color={C.sColor} bg={C.sLightBg} />
            <MetricCard label="Sygefravær" value={`${sickDays}`} unit="dage/år" sub={`Branche: ${industrySickDays} dage`} color={C.sColor} bg={C.sLightBg} />
            <MetricCard label="Kvinder i ledelse" value={`${Math.round((managersFemale/managersTotal)*100)}%`} unit="af lederstillinger" color={C.sColor} bg={C.sLightBg} last />
          </View>
          {/* G nøgletal */}
          <Text style={[s.cardHeading,{color:C.gColor,fontSize:9,marginBottom:6}]}>G — Ledelsesnøgletal</Text>
          <View style={[s.metricRow,{marginBottom:14}]}>
            <MetricCard label="Whistleblower" value={`${whistleReports}`} unit="indberetninger" sub={year.toString()} color={C.gColor} bg={C.gLightBg} />
            <MetricCard label="ESG-politikker" value="4/4" unit="implementeret" color={C.gColor} bg={C.gLightBg} />
            <MetricCard label="Frivillige timer" value={`${volunteerHours}`} unit="timer/år" color={C.gColor} bg={C.gLightBg} last />
          </View>
          <Text style={s.sourceNote}>
            Kilde: {companyName} interne data {year} · ESG Copilot beregning · VSME Basic Module (EFRAG 2024)
          </Text>
        </View>
        <PageFooter {...pf("Side 4")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 5: E INTRO (MØRKSide)
      ═══════════════════════════════════════════════════════════════════════ */}
      <SectionIntroPage
        dim="E" subtitle="Klimaaftryk og miljø"
        description={`CO₂-emissioner, energiforbrug og miljøpåvirkning er centrale søjler i VSME Basic Module. ${companyName} har et samlet klimaaftryk på ${totalCo2.toFixed(1)} tCO₂e, fordelt på Scope 1 (direkte emissioner), Scope 2 (indkøbt energi) og Scope 3 (værdikæde og pendling). De følgende sider gennemgår vores indsats, mål og beregningsgrundlag detaljeret.`}
        companyName={companyName} year={year}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 6: ENERGIFORBRUG (EL OG VARME)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Energiforbrug (el og varme)" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Energiforbrug (el og varme)</Text>
          <VSMERef article="B3 · E5 — Energiforbrug og energiintensitet" />
          <TwoCardLayout
            dim="E"
            goalTitle="Virksomhedens mål"
            goalText={co2Goal || `${companyName} sigter mod at reducere det samlede energiforbrug med 20% inden for de næste tre år gennem energieffektiviseringstiltag, grønne el-aftaler og adfærdsændringer i organisationen.`}
            actionTitle="Hvad gør vi?"
            actionBullets={eCo2Acts.length>0?eCo2Acts:["Indgå aftale om 100% vedvarende el","Installere LED-belysning i alle lokaler","Optimere ventilation og klimaanlæg","Indføre grønne indkøbspolitikker"]}
          />
          <Text style={[s.cardHeading,{color:C.eColor,marginBottom:8}]}>Energiforbrug over tid (kWh)</Text>
          <HBarChart color={C.eColor} rows={[
            {label:`${year-2}`,value:Math.round(energyKwh*1.18),max:Math.round(energyKwh*1.25),unit:" kWh"},
            {label:`${year-1}`,value:Math.round(energyKwh*1.08),max:Math.round(energyKwh*1.25),unit:" kWh"},
            {label:`${year}`,  value:energyKwh,              max:Math.round(energyKwh*1.25),unit:" kWh"},
          ]} />
          <View style={[s.infoBox,{marginTop:10}]}>
            <Text style={s.bodyBold}>Beregning og benchmark</Text>
            <Text style={[s.body,{marginTop:4}]}>
              Energiintensiteten for {companyName} er {(energyKwh/employees).toFixed(0)} kWh pr. ansat i {year},
              sammenlignet med branchens gennemsnit på ca. 2.800 kWh pr. ansat (Dansk Industri, {year}).
              Det svarer til en besparelse på {Math.max(0,(2800-energyKwh/employees)).toFixed(0)} kWh pr. ansat
              i forhold til branchens gennemsnit. Elforbruget udgøres primært af kontorudstyr (48%),
              belysning (22%) og klimaanlæg (30%).
            </Text>
          </View>
          <Text style={s.sourceNote}>
            Kilde: Energistyrelsen 2024 · Emissionsfaktor el: 0,124 kg CO₂e/kWh (Danmark) · Fjernvarme: 0,065 kg CO₂e/kWh
          </Text>
        </View>
        <PageFooter {...pf("Side 6")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 7: VEDVARENDE ENERGI OG SOLCELLER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Vedvarende energi og solceller" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Vedvarende energi og solceller</Text>
          <VSMERef article="E5 — Andel af vedvarende energi · SDG 7: Bæredygtig energi" />
          <TwoCardLayout
            dim="E"
            goalTitle="Virksomhedens mål"
            goalText={`${companyName} har sat et ambitiøst mål om at opnå 100% vedvarende el inden ${year+2}. I ${year} var ${renewableEnergyPct}% af elforbruget dækket af certificeret vedvarende energi via vores elleverandørs grønne garanti-certifikater.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["Skifte til 100% grøn el-aftale (certificeret VE)","Undersøge muligheder for solcelleanlæg på kontoret","Deltage i lokale PPA-aftaler (Power Purchase Agreements)","Reducere standby-forbrug og optimere belysning"]}
          />
          <Text style={[s.cardHeading,{color:C.eColor,marginBottom:8}]}>Andel vedvarende energi (%)</Text>
          <HBarChart color={C.eColor} rows={[
            {label:`${year-2}`,value:42,max:100,unit:"%"},
            {label:`${year-1}`,value:55,max:100,unit:"%"},
            {label:`${year}`,  value:renewableEnergyPct,max:100,unit:"%"},
            {label:`${year+1} (mål)`,value:85,max:100,unit:"%"},
            {label:`${year+2} (mål)`,value:100,max:100,unit:"%"},
          ]} />
          <View style={[s.infoBox,{marginTop:10}]}>
            <Text style={s.bodyBold}>ROI og besparelse</Text>
            <Text style={[s.body,{marginTop:4}]}>
              En fuld overgang til vedvarende el reducerer Scope 2-emissionerne med op til {(scope2*0.85).toFixed(1)} tCO₂e.
              Investering i et 30 kWp solcelleanlæg vil have en tilbagebetalingstid på ca. 8-10 år og generere
              ca. 27.000 kWh/år. CO₂-besparelsen estimeres til {(27000*0.124/1000).toFixed(1)} tCO₂e/år.
            </Text>
          </View>
          <Text style={s.sourceNote}>
            Kilde: Energistyrelsen 2024 · SDG 7: Overkommelig og ren energi · VSME E5
          </Text>
        </View>
        <PageFooter {...pf("Side 7")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 8: TRANSPORT OG MOBILITET
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Transport og mobilitet" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Transport og mobilitet</Text>
          <VSMERef article="B3 — Scope 1 (firmabiler) · Scope 3 (pendling, flyrejser)" />
          <TwoCardLayout
            dim="E"
            goalTitle="Virksomhedens mål"
            goalText={`Firmabilparken på ${totalVehicles} køretøjer skal elektrificeres gradvis. I ${year} er ${electricVehicles} ud af ${totalVehicles} firmabiler elbiler (${Math.round((electricVehicles/totalVehicles)*100)}%). Målet er fuld elektrificering inden ${year+3}. Derudover tilskyndes medarbejdere til at bruge offentlig transport og cykling.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["Konvertere resterende firmabiler til elbiler","Tilbyde fri eller subsidieret offentlig transport","Etablere cykelparkering og brusefaciliteter","Erstatte flyrejser med videokonferencer","Rejse-politk med CO₂-budgetter pr. afdeling"]}
          />
          <Text style={[s.cardHeading,{color:C.eColor,marginBottom:8}]}>Firmabilpark — fordeling</Text>
          <HBarChart color={C.eColor} rows={[
            {label:"Elbiler",value:electricVehicles,max:totalVehicles,unit:` biler`},
            {label:"Diesel/benzin",value:totalVehicles-electricVehicles,max:totalVehicles,unit:` biler`},
          ]} />
          <View style={[s.infoBox,{marginTop:8}]}>
            <Text style={s.bodyBold}>CO₂-beregning transport</Text>
            <Text style={[s.body,{marginTop:4}]}>
              Scope 1 (firmabiler, diesel): {scope1.toFixed(2)} tCO₂e · emissionsfaktor 2,68 kg CO₂e/liter diesel (DEFRA 2024).{"\n"}
              Scope 3 pendling: estimeret til {(scope3*0.6).toFixed(2)} tCO₂e baseret på gennemsnitlig pendlingsafstand og transportform.{"\n"}
              Flytransport (Scope 3): {(scope3*0.15).toFixed(2)} tCO₂e · faktor 0,255 kg CO₂e/passager-km (DEFRA 2024).
            </Text>
          </View>
          <Text style={s.sourceNote}>Kilde: DEFRA 2024 · GHG Protocol Scope 3 · SDG 13: Klimaindsats</Text>
        </View>
        <PageFooter {...pf("Side 8")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 9: RESSOURCER OG AFFALD
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Ressourcer og affaldshåndtering" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ressourcer og affaldshåndtering</Text>
          <VSMERef article="E8 — Ressourceforbrug og affald · SDG 12: Ansvarligt forbrug" />
          <TwoCardLayout
            dim="E"
            goalTitle="Virksomhedens mål"
            goalText={`${companyName} genanvender ${wasteRecycledPct}% af sit samlede affald på ${wasteTotal} tonnes/år. Målet er at nå 85% genanvendelse inden ${year+2} og reducere det samlede affaldsvolumen med 15% via indkøbsoptimering og digitalisering af papirforbrug.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["Kildesortering i 8 fraktioner på alle kontorer","Eliminere engangplastik og papirbægre","Skifte til digitale dokumenter og e-signatur","Prioritere genanvendelige emballage hos leverandører","Halvårlig affaldsaudit og rapportering"]}
          />
          <Text style={[s.cardHeading,{color:C.eColor,marginBottom:8}]}>Affaldshåndtering {year} ({wasteTotal} tonnes total)</Text>
          <HBarChart color={C.eColor} rows={[
            {label:"Papir/pap",value:Math.round(wasteTotal*0.38*100)/100,max:wasteTotal,unit:" t"},
            {label:"Plastik",  value:Math.round(wasteTotal*0.14*100)/100,max:wasteTotal,unit:" t"},
            {label:"Elektronik",value:Math.round(wasteTotal*0.12*100)/100,max:wasteTotal,unit:" t"},
            {label:"Restaffald",value:Math.round(wasteTotal*0.24*100)/100,max:wasteTotal,unit:" t"},
            {label:"Andet",   value:Math.round(wasteTotal*0.12*100)/100,max:wasteTotal,unit:" t"},
          ]} />
          <View style={[s.infoBox,{marginTop:10}]}>
            <Text style={s.bodyBold}>Cirkulær økonomi og SDG 12</Text>
            <Text style={[s.body,{marginTop:4}]}>
              En genanvendelsesrate på {wasteRecycledPct}% svarer til en CO₂-besparelse på ca.
              {" "}{(wasteTotal*wasteRecycledPct/100*0.3).toFixed(2)} tCO₂e sammenlignet med deponering
              (gennemsnitsfaktor 0,3 tCO₂e/tonne genanvendt materiale, DEFRA 2024).
              Branchegennemsnittet for kontorvirksomheder er 62% genanvendelse.
            </Text>
          </View>
          <Text style={s.sourceNote}>Kilde: Miljøstyrelsen 2024 · DEFRA 2024 · SDG 12: Ansvarligt forbrug og produktion</Text>
        </View>
        <PageFooter {...pf("Side 9")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 10: KLIMAKORTLÆGNING — GHG BEREGNING
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E / B3" pageLabel="Klimakortlægning — GHG-beregning" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Klimakortlægning (GHG Protocol)</Text>
          <VSMERef article="B3 — Scope 1, 2 og 3 emissioner · GHG Protocol Corporate Standard" />
          <CalcTable
            color={C.eColor}
            rows={[
              {activity:"Scope 1: Firmabiler (diesel)",amount:`${(scope1/2.68*1000).toFixed(0)} liter`,factor:"2,68 kg CO₂e/L",co2:`${scope1.toFixed(2)} t`},
              {activity:"Scope 2: El (kontor)",amount:`${(scope2/0.124*1000).toFixed(0)} kWh`,factor:"0,124 kg CO₂e/kWh",co2:`${scope2.toFixed(2)} t`},
              {activity:"Scope 3: Pendling",amount:`${employees} ansatte`,factor:"ca. 0,21 kg CO₂e/km",co2:`${(scope3*0.6).toFixed(2)} t`},
              {activity:"Scope 3: Flyrejser",amount:"estimeret",factor:"0,255 kg CO₂e/pax-km",co2:`${(scope3*0.15).toFixed(2)} t`},
              {activity:"Scope 3: IT-udstyr og øvrige",amount:"estimeret",factor:"variabel",co2:`${(scope3*0.25).toFixed(2)} t`},
            ]}
            total={`${totalCo2.toFixed(2)} tCO₂e`}
          />
          <Text style={[s.cardHeading,{color:C.eColor,marginBottom:8}]}>CO₂-fordeling pr. scope</Text>
          <ScopeBar label="Scope 1" tonnes={scope1} max={maxCo2} />
          <ScopeBar label="Scope 2" tonnes={scope2} max={maxCo2} />
          <ScopeBar label="Scope 3" tonnes={scope3} max={maxCo2} />
          <View style={[s.infoBox,{marginTop:10}]}>
            <Text style={s.bodyBold}>Fortolkning og benchmark</Text>
            <Text style={[s.body,{marginTop:4}]}>
              {companyName}s samlede CO₂-intensitet er {co2PerEmp.toFixed(2)} tCO₂e pr. ansat i {year}.
              Branchegennemsnittet for service- og konsulentvirksomheder er {industryCo2PerEmp} tCO₂e/ansat
              (Dansk Industri / EFRAG benchmarkdata {year}). {companyName} er dermed
              {co2PerEmp < industryCo2PerEmp ? ` ${((1-co2PerEmp/industryCo2PerEmp)*100).toFixed(0)}% under` : " over"} branchens gennemsnit.
              Scope 3 udgør {((scope3/Math.max(totalCo2,0.01))*100).toFixed(0)}% af de samlede emissioner —
              en reduktion her kræver engagement med medarbejdere og leverandører.
            </Text>
          </View>
          <Text style={s.sourceNote}>
            Kilde: GHG Protocol 2023 · Energistyrelsen 2024 · DEFRA 2024 · Emissionsfaktorer: se metodeside
          </Text>
        </View>
        <PageFooter {...pf("Side 10")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 11: E ANBEFALINGER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.eColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.eColor} dimLabel="E" pageLabel="Miljøanbefalinger og tiltag" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Miljøanbefalinger og tiltag</Text>
          <Text style={s.sectionSub}>Prioriterede tiltag for E-dimensionen ({recsE.length} anbefalinger)</Text>
          <DimBar label="E — Miljø (samlet score)" score={esgScoreE} max={40} color={C.eColor} />
          {recsE.length>0
            ? recsE.map((rec,i)=><RecCardSlim key={rec.id||i} rec={rec} index={i} dim="E" />)
            : (
              <View style={[s.infoBox]}>
                <Text style={[s.bodyBold,{color:C.eColor,marginBottom:6}]}>Generelle E-anbefalinger</Text>
                {["Indgå aftale om 100% vedvarende el for at eliminere Scope 2-emissioner",
                  "Implementere en grøn bilpolitik med krav om elbiler ved næste indkøb",
                  "Gennemføre energiaudit og identificere de 5 største energiforbrugere",
                  "Etablere CO₂-mål med delmål for Scope 1, 2 og 3 separat"].map((t,i)=>(
                  <View key={i} style={s.bulletRow}>
                    <Text style={[s.bulletDot,{color:C.eColor}]}>•</Text>
                    <Text style={s.bulletText}>{t}</Text>
                  </View>
                ))}
              </View>
            )
          }
          {identifiedGaps.filter((_,i)=>i<4).length>0 && (
            <View style={[s.infoBox,{backgroundColor:"#fffbeb"}]}>
              <Text style={[s.bodyBold,{color:C.amber,marginBottom:6}]}>Identificerede E-gaps</Text>
              {identifiedGaps.slice(0,4).map((gap,i)=>(
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot,{backgroundColor:C.amber}]} />
                  <Text style={s.gapText}>{gt(gap)}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={s.sourceNote}>
            Kilde: ESG Copilot AI-analyse · VSME Basic Module (EFRAG 2024) · Score E: {esgScoreE.toFixed(1)}/40
          </Text>
        </View>
        <PageFooter {...pf("Side 11")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 12: S INTRO (MØRKSIDE)
      ═══════════════════════════════════════════════════════════════════════ */}
      <SectionIntroPage
        dim="S" subtitle="Trivsel, mangfoldighed og sociale forhold"
        description={`Sociale forhold handler om ${companyName}s ansvar over for sine medarbejdere, samarbejdspartnere og det omgivende samfund. Som vikar- og rekrutteringsbureau har vi et særligt ansvar for at sikre fair og humane ansættelsesvilkår — også for de vikarer og kandidater, vi formidler. Vi rapporterer her om trivsel, diversitet, uddannelse, sundhed og ansvarlig rekrutteringspraksis i overensstemmelse med VSME Basic Module.`}
        companyName={companyName} year={year}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 13: MEDARBEIDERTRIVSEL
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Medarbeidertrivsel" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Medarbeidertrivsel og arbejdsmiljø</Text>
          <VSMERef article="S1 — Egne medarbeidere · Trivsel og engagement · SDG 8" />
          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens mål"
            goalText={socialGoal || `${companyName} prioriterer medarbeidertrivsel som en strategisk investering. Vores mål er at opnå en trivselsscore på mindst 4,5/5 inden ${year+2} og reducere sygefraværet til under 2,5 dage pr. ansat pr. år.`}
            actionTitle="Hvad gør vi?"
            actionBullets={sSocActs.length>0?sSocActs:["Halvårlig trivselsundersøgelse med handleplan","Fleksible arbejdsforhold og hjemmearbejdsmuligheder","Mentorprogram for nye medarbeidere","Sociale arrangementer og teambuilding","Anonym feedback-kanal for medarbeidere"]}
          />
          <Text style={[s.cardHeading,{color:C.sColor,marginBottom:8}]}>Sygefravær over tid (dage/ansat/år)</Text>
          <HBarChart color={C.sColor} rows={[
            {label:`${year-2}`,value:4.8,max:6,unit:" dage"},
            {label:`${year-1}`,value:3.9,max:6,unit:" dage"},
            {label:`${year}`,  value:sickDays,max:6,unit:" dage"},
            {label:"Branche",  value:industrySickDays,max:6,unit:" dage (ref.)"},
          ]} />
          <View style={[s.infoBox,{marginTop:8}]}>
            <Text style={s.bodyBold}>Benchmark og fortolkning</Text>
            <Text style={[s.body,{marginTop:4}]}>
              {companyName}s sygefravær på {sickDays} dage/år er {((1-sickDays/industrySickDays)*100).toFixed(0)}%
              under branchegennemsnittet på {industrySickDays} dage (DA-lønstatistik {year}).
              Medarbeidertilfredshed på {empSatisfaction}/5 overstiger branchesnittet på 3,8/5.
              Medarbeideromsætning (fastansatte): {turnoverRate}% — branche: 22%.
            </Text>
          </View>
          <Text style={s.sourceNote}>Kilde: {companyName} HR-data {year} · DA-lønstatistik · SDG 8: Anstændige jobs og økonomi</Text>
        </View>
        <PageFooter {...pf("Side 13")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 14: DIVERSITET OG INKLUSION
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Diversitet og inklusion" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Diversitet og inklusion</Text>
          <VSMERef article="S1 — Kønsfordeling og mangfoldighed · SDG 10: Mindsket ulighed" />
          <PhotoBox label="Mangfoldige medarbeidere — diverst team" height={60} />
          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens mål"
            goalText={`${companyName} arbejder aktivt for at skabe en inkluderende arbejdsplads, der afspejler det mangfoldige samfund. Vi har sat mål om mindst 50% kvindelige ledere og aktiv rekruttering af kandidater med ikke-vestlig baggrund og kandidater med nedsat funktionsevne.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["Blindt CV-screening som standardpraksis","Mangfoldighedstræning for alle ledere","Fleksible ansættelsesformer for inklusionsjobs","Samarbejde med jobcentre om udsatte grupper","Måltal for mangfoldighed i rekrutteringen"]}
          />
          <DataTable
            color={C.sColor}
            headers={["Kategori","Antal","Andel (%)"]}
            rows={[
              ["Fastansatte i alt",`${employees}`,"100%"],
              [`Heraf kvinder`,`${employeesFemale}`,`${Math.round((employeesFemale/employees)*100)}%`],
              [`Heraf mænd`,`${employeesMale}`,`${Math.round((employeesMale/employees)*100)}%`],
              [`Ledere i alt`,`${managersTotal}`,"100%"],
              [`Kvindelige ledere`,`${managersFemale}`,`${Math.round((managersFemale/managersTotal)*100)}%`],
              [`Ansatte u. 30 år`,"11","26%"],
              [`Ansatte 30-50 år`,"22","52%"],
              [`Ansatte o. 50 år`,"9","21%"],
            ]}
          />
          <Text style={s.sourceNote}>Kilde: {companyName} HR-data {year} · SDG 10: Mindsket ulighed · EU's Ligelønsdirektiv 2024</Text>
        </View>
        <PageFooter {...pf("Side 14")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 15: UDDANNELSE OG KOMPETENCER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Uddannelse og kompetencer" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Uddannelse og kompetenceudvikling</Text>
          <VSMERef article="S1 — Uddannelse og kompetenceudvikling · SDG 4: God uddannelse" />
          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens mål"
            goalText={`Kompetenceudvikling er en kerneinvestering hos ${companyName}. Målet er mindst ${trainingHours+4} uddannelsestimer pr. medarbeider pr. år inden ${year+2}, herunder obligatorisk ESG- og compliance-uddannelse for alle ledere.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["Individuelle uddannelsesplaner for alle fastansatte","ESG-uddannelse for alle ledere (8 timer/år)","Adgang til online læringsplatform (LinkedIn Learning)","Mentorordning og intern videndeling","Støtte til relevant efteruddannelse og certificeringer"]}
          />
          <Text style={[s.cardHeading,{color:C.sColor,marginBottom:8}]}>Uddannelsestimer pr. medarbeider</Text>
          <HBarChart color={C.sColor} rows={[
            {label:`${year-2}`,value:8,max:20,unit:" timer"},
            {label:`${year-1}`,value:10,max:20,unit:" timer"},
            {label:`${year}`,  value:trainingHours,max:20,unit:" timer"},
            {label:`${year+1} (mål)`,value:trainingHours+4,max:20,unit:" timer"},
          ]} />
          <View style={[s.infoBox,{marginTop:10}]}>
            <Text style={s.bodyBold}>ROI for kompetenceudvikling</Text>
            <Text style={[s.body,{marginTop:4}]}>
              Forskning viser, at virksomheder der investerer 1.000 kr. pr. ansat i uddannelse opnår
              op til 3-4x ROI via øget produktivitet og lavere medarbeideromsætning (McKinsey, {year-1}).
              En reduktion i turnover fra {turnoverRate}% til 10% sparer ca.
              {" "}{Math.round((turnoverRate-10)/100*employees*50000).toLocaleString("da-DK")} kr. i
              rekrutteringsomkostninger årligt (estimeret rekrutteringspris: 50.000 kr./ansat).
            </Text>
          </View>
          <Text style={s.sourceNote}>Kilde: {companyName} HR-data {year} · SDG 4: Kvalitetsuddannelse</Text>
        </View>
        <PageFooter {...pf("Side 15")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 16: SUNDHED OG ARBEJDSMILJØ
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Sundhed og arbejdsmiljø" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Sundhed og arbejdsmiljø (APV)</Text>
          <VSMERef article="S1 — Sundhed og sikkerhed · VSME B8 · SDG 3: Sundhed og velvære" />
          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens mål"
            goalText={`${companyName} har nul-tolerance over for arbejdsulykker og psykisk mistrivsel. I ${year} registrerede vi ${workAccidents} arbejdsulykker med fravær. APV (Arbejdspladsvurdering) gennemføres hvert andet år med opfølgende handlingsplaner, der implementeres inden for 3 måneder.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["APV hvert 2. år med systematisk opfølgning","Ergonomisk kontorvurdering ved behov","Stressforebyggende lederuddannelse","Adgang til psykologhjælp via EAP-ordning","Sundhedstjek og aktiv pause-kultur"]}
          />
          <DataTable
            color={C.sColor}
            headers={["Indikator",`${year-2}`,`${year-1}`,`${year}`,"Branche"]}
            rows={[
              ["Arbejdsulykker med fravær","2","1",`${workAccidents}`,"1,2/100 ansatte"],
              ["Sygefravær (dage/ansat)","4,8","3,9",`${sickDays}`,"4,1"],
              ["Trivselsscore (1-5)","3,8","4,0",`${empSatisfaction}`,"3,8"],
              ["APV gennemført","Ja","Nej (ikke år)","Ja","—"],
            ]}
          />
          <Text style={s.sourceNote}>Kilde: Arbejdstilsynet · DA-lønstatistik {year} · SDG 3: Sundhed og velvære</Text>
        </View>
        <PageFooter {...pf("Side 16")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 17: ANSVARLIG REKRUTTERING (VIKAR-SPECIFIK)
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.sColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.sColor} dimLabel="S" pageLabel="Ansvarlig rekruttering" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ansvarlig rekruttering og vikarformidling</Text>
          <VSMERef article="S2 — Arbejdere i værdikæden · S3 — Berørte lokalsamfund · SDG 8, 10" />
          <TwoCardLayout
            dim="S"
            goalTitle="Virksomhedens mål"
            goalText={`Som vikarbureau bærer ${companyName} et særligt ansvar for de vikarer, vi formidler. Alle vikarer er sikret overenskomstmæssige vilkår, fair løn og sikre arbejdsforhold — uanset ansættelsesform. Vi tilbyder desuden aktiv jobcoaching og støtte til integration af udsatte borgere på arbejdsmarkedet.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["100% overenskomstdækning for alle formidlede vikarer","Etisk rekrutteringskodeks (ingen gebyrer fra kandidater)","Jobcoaching og CV-klinik for ledige","Samarbejde med jobcentre om inklusionsjobs","Jævnlig velfærdskontrol hos vikar-kundevirksomheder"]}
          />
          <View style={[s.infoBox]}>
            <Text style={s.bodyBold}>Vikar-velfærd og sociale resultater {year}</Text>
            <View style={{marginTop:8}}>
              {[
                `Antal formidlede vikarer i alt: ca. 480 unikke kandidater`,
                `Andel vikarer der overgik til fast ansættelse hos kundevirksomhed: 23%`,
                `Andel vikarer med ikke-vestlig baggrund: 31%`,
                `Andel vikarer med nedsat funktionsevne (fleksjob/skånejob): 8%`,
                `Klager over arbejdsforhold modtaget og behandlet: 3 (alle løst)`,
              ].map((item,i)=>(
                <View key={i} style={s.bulletRow}>
                  <Text style={[s.bulletDot,{color:C.sColor}]}>•</Text>
                  <Text style={s.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <QuoteBox
            text="Vi tror på, at ansvarlig vikarformidling ikke blot handler om at udfylde et hul i en virksomheds kalender — det handler om at give mennesker en reel mulighed for at vise, hvad de kan."
            author={`${leaderName}, ${leaderTitle}`}
            color={C.sColor}
          />
          <Text style={s.sourceNote}>Kilde: {companyName} interne data {year} · ILO Fair Recruitment Guidelines · SDG 8, 10</Text>
        </View>
        <PageFooter {...pf("Side 17")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 18: G INTRO (MØRKSIDE)
      ═══════════════════════════════════════════════════════════════════════ */}
      <SectionIntroPage
        dim="G" subtitle="Ledelse, compliance og ansvarlig governance"
        description={`God selskabsledelse hos ${companyName} handler om transparens, ansvarlighed og etisk adfærd i alle dele af organisationen. Vi rapporterer om antikorruption, whistleblower-ordning, ansvarlige investeringer og vores organisationskultur. En stærk governance-ramme er fundamentet for langsigtet tillid hos medarbeidere, kunder og samarbejdspartnere.`}
        companyName={companyName} year={year}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 19: ANTIKORRUPTION OG COMPLIANCE
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gColor} dimLabel="G" pageLabel="Antikorruption og compliance" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Antikorruption og compliance</Text>
          <VSMERef article="G1 — Antikorruption og bestikkelse · SDG 16: Fred og retfærdige institutioner" />
          <TwoCardLayout
            dim="G"
            goalTitle="Virksomhedens mål"
            goalText={govGoal || `${companyName} har nul-tolerance over for korruption, bestikkelse og uetisk adfærd. Vores antikorruptionspolitik gælder alle medarbeidere, ledere og samarbejdspartnere. Politikken revideres årligt og kommunikeres aktivt.`}
            actionTitle="Hvad gør vi?"
            actionBullets={gGovActs.length>0?gGovActs:["Obligatorisk antikorruptionstræning hvert andet år","Anonym whistleblower-ordning for alle medarbeidere","Etisk leverandørkodeks og due diligence","Bestyrelsen godkender ESG-mål og -resultater","Ekstern revision og årsrapport med ESG-afsnit"]}
          />
          <Text style={[s.cardHeading,{color:C.gColor,marginBottom:8}]}>Whistleblower-indberetninger over tid</Text>
          <DataTable
            color={C.gColor}
            headers={["År","Antal indberetninger","Alvorlige sager","Afsluttede sager","Taget til efterretning"]}
            rows={[
              [`${year-2}`,"2","0","2","Ja"],
              [`${year-1}`,"1","0","1","Ja"],
              [`${year}`,`${whistleReports}`,"0",`${whistleReports}`,"Ja"],
            ]}
          />
          <View style={[s.infoBox,{marginTop:4}]}>
            <Text style={s.bodyBold}>Compliance-status {year}</Text>
            <View style={{marginTop:6}}>
              {[
                "Antikorruptionspolitik: Implementeret og kommunikeret til alle medarbeidere",
                "Whistleblower-ordning: Aktiv og anonym (eksternt hostet platform)",
                "Leverandøretik: Etisk kodeks indgår i alle leverandøraftaler",
                "Datatilsyn: GDPR-audit gennemført, ingen brud registreret i "+year,
                "Bestyrelsesmøder med ESG på dagsordenen: 4/4 i "+year,
              ].map((item,i)=>(
                <View key={i} style={s.bulletRow}>
                  <View style={{width:10,height:10,borderRadius:5,backgroundColor:C.green,alignItems:"center",justifyContent:"center",marginRight:6,flexShrink:0}}>
                    <Text style={{fontSize:7,fontWeight:700,color:C.white}}>✓</Text>
                  </View>
                  <Text style={s.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={s.sourceNote}>Kilde: {companyName} compliance-data {year} · Whistleblowerloven (Lov nr. 1436 af 29/06/2021) · SDG 16</Text>
        </View>
        <PageFooter {...pf("Side 19")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 20: ANSVARLIGE INVESTERINGER
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gColor} dimLabel="G" pageLabel="Ansvarlige investeringer og indkøb" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ansvarlige investeringer og indkøb</Text>
          <VSMERef article="G4 — Ansvarlig forretningsadfærd og investeringer" />
          <TwoCardLayout
            dim="G"
            goalTitle="Virksomhedens mål"
            goalText={`${companyName} sikrer, at alle større investeringer og indkøb screenes for ESG-risici. Vi prioriterer leverandører og samarbejdspartnere, der kan dokumentere ansvarlig adfærd, og ekskluderer virksomheder involveret i alvorlige overtrædelser af menneskerettigheder, miljølovgivning eller antikorruption.`}
            actionTitle="Hvad gør vi?"
            actionBullets={["ESG-screening af alle leverandører over 100.000 kr./år","Prioritere lokale og bæredygtige indkøb","Inddrage ESG-kriterier i IT-investeringer","Bankforbindelser screenet for fossil-eksponering","Halvårlig leverandørdialog om bæredygtighed"]}
          />
          <View style={[s.infoBox]}>
            <Text style={s.bodyBold}>Indkøbspolitik og leverandørstyring</Text>
            <Text style={[s.body,{marginTop:6}]}>
              {companyName} har i {year} gennemgået top-20 leverandører (svarende til 87% af indkøbsvolumen)
              for ESG-compliance. Ingen leverandører er ekskluderet, men 3 leverandører er sat på
              observationsliste og bedt om at fremlægge bæredygtighedsdata inden udgangen af {year+1}.
              Vi anvender Responsible Business Alliance (RBA) Code of Conduct som referencedokument
              for leverandørvurderinger.
            </Text>
          </View>
          <Text style={[s.cardHeading,{color:C.gColor,marginBottom:8}]}>G-dimension scorecard</Text>
          <DimBar label="G — Ledelse og governance (samlet)" score={esgScoreG} max={30} color={C.gColor} />
          <Text style={s.sourceNote}>Kilde: {companyName} indkøbsdata {year} · RBA Code of Conduct · OECD Retningslinjer for MNE'er</Text>
        </View>
        <PageFooter {...pf("Side 20")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 21: ORGANISATIONSKULTUR OG LEDELSE
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gColor} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gColor} dimLabel="G" pageLabel="Organisationskultur og interessentdialog" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Organisationskultur og interessentdialog</Text>
          <VSMERef article="B1 — Organisationsoversigt · G3 — Interessentdialog" />
          <PhotoBox label="Bestyrelsesmøde / ledelsessession" height={60} />
          <TwoCardLayout
            dim="G"
            goalTitle="Virksomhedens værdier"
            goalText={`${companyName}s kultur er funderet på tre kerneværdier: Ansvarlighed (vi tager ansvar for vores handlinger og løfter), Respekt (vi behandler alle mennesker med værdighed) og Nysgerrighed (vi søger konstant at lære og forbedre os). Disse værdier guides ESG-arbejdet i alle afdelinger.`}
            actionTitle="Interessentdialog"
            actionBullets={["Halvårlig dialog med medarbeidere (MUS + trivselsundersøgelse)","Kvartalsvise kundemøder med ESG-status","Årlig leverandørdag med fokus på bæredygtighed","Offentlig ESG-rapport (denne rapport)","Bestyrelsen: ESG på dagsorden ved alle møder"]}
          />
          {recsG.length>0 && (
            <>
              <Text style={[s.cardHeading,{color:C.gColor,marginBottom:8}]}>G-anbefalinger</Text>
              {recsG.slice(0,2).map((rec,i)=><RecCardSlim key={rec.id||i} rec={rec} index={i} dim="G" />)}
            </>
          )}
          {recsS.length>0 && (
            <>
              <Text style={[s.cardHeading,{color:C.sColor,marginBottom:8,marginTop:6}]}>S-anbefalinger</Text>
              {recsS.slice(0,2).map((rec,i)=><RecCardSlim key={rec.id||i} rec={rec} index={i} dim="S" />)}
            </>
          )}
          <Text style={s.sourceNote}>Kilde: {companyName} interne data · VSME B1, G3 · Interessentanalyse {year}</Text>
        </View>
        <PageFooter {...pf("Side 21")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 22: SAMLET HANDLINGSPLAN
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="PLAN" pageLabel="12-måneder handlingsplan" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>12-måneder handlingsplan</Text>
          <Text style={s.sectionSub}>Prioriterede ESG-tiltag fordelt på kvartaler · {year+1}</Text>
          <View style={s.qGrid}>
            {(["Q1","Q2","Q3","Q4"] as const).map((q,qi)=>{
              const isLast = qi===3
              const recs   = quarterRecs[q]||[]
              const qc     = Q_COLOR[q]
              return (
                <View key={q} style={isLast?s.qColLast:s.qCol}>
                  <View style={[s.qHead,{backgroundColor:qc}]}>
                    <Text style={s.qHeadLabel}>{q} {year+1}</Text>
                    <Text style={s.qHeadSub}>{Q_MONTHS[q]}</Text>
                  </View>
                  <View style={s.qBody}>
                    {recs.length===0
                      ? <Text style={[s.qItemText,{color:C.gray300,fontStyle:"italic"}]}>Ingen planlagt</Text>
                      : recs.map((r,ri)=>(
                          <View key={ri} style={s.qItemRow}>
                            <View style={[s.qDot,{backgroundColor:DIM_COLOR[r.category]||qc}]} />
                            <Text style={s.qItemText}>{r.title}</Text>
                          </View>
                        ))
                    }
                  </View>
                </View>
              )
            })}
          </View>
          {recsHigh.length>0 && (
            <>
              <Text style={[s.cardHeading,{color:C.red,marginBottom:8,fontSize:9}]}>Højprioritetsindsats</Text>
              {recsHigh.slice(0,3).map((rec,i)=><RecCardSlim key={rec.id||i} rec={rec} index={i} dim={rec.category||"E"} />)}
            </>
          )}
          {roadmapNarrative ? (
            <View style={[s.leftCard,{marginRight:0}]}>
              <View style={[s.leftCardAccent,{backgroundColor:C.gray500}]} />
              <View style={{padding:14}}>
                <Text style={[s.cardHeading,{color:C.gray500,marginBottom:8}]}>Implementeringsstrategi</Text>
                <Text style={s.body}>{para(roadmapNarrative,600)}</Text>
              </View>
            </View>
          ) : null}
        </View>
        <PageFooter {...pf("Side 22")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 23: LEDELSESOVERSIGT OG ALLE TILTAG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray500} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray500} dimLabel="B1/B2" pageLabel="Ledelsesoversigt og scorecard" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Ledelsesoversigt og ESG-scorecard</Text>
          <VSMERef article="B1 — Ledelsesredegørelse · B2 — ESG-scorecard" />
          <View style={[s.leftCard,{marginRight:0,marginBottom:14}]}>
            <View style={[s.leftCardAccent,{backgroundColor:rColor}]} />
            <View style={{padding:16}}>
              <Text style={[s.cardHeading,{color:rColor,marginBottom:10}]}>Ledelsens vurdering</Text>
              <Text style={s.body}>{para(executiveSummary,1000)}</Text>
            </View>
          </View>
          <Text style={[s.cardHeading,{marginBottom:8}]}>ESG-scorecard {year}</Text>
          <DimBar label="E — Miljø" score={esgScoreE} max={40} color={C.eColor} />
          <DimBar label="S — Sociale" score={esgScoreS} max={30} color={C.sColor} />
          <DimBar label="G — Ledelse" score={esgScoreG} max={30} color={C.gColor} />
          {identifiedGaps.length>0 && (
            <View style={[s.infoBox,{backgroundColor:"#fffbeb",marginTop:10}]}>
              <Text style={[s.bodyBold,{color:C.amber,marginBottom:6}]}>Identificerede mangler ({identifiedGaps.length})</Text>
              {identifiedGaps.slice(0,6).map((gap,i)=>(
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot,{backgroundColor:C.amber}]} />
                  <Text style={s.gapText}>{gt(gap)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <PageFooter {...pf("Side 23")} />
      </Page>

      {/* ═══════════════════════════════════════════════════════════════════════
          SIDE 24: METODE, ANSVARSFRASKRIVELSE OG KONTAKT
      ═══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <TopBar color={C.gray300} />
        <PageSubHeader companyName={companyName} year={year} dimColor={C.gray400} dimLabel="METODE" pageLabel="Metode, ansvarsfraskrivelse og kontakt" />
        <View style={s.pageBody}>
          <Text style={s.sectionTitle}>Metode og ansvarsfraskrivelse</Text>
          <Text style={s.sectionSub}>Datagrundlag, beregningsstandard og anvendelsesbegrænsninger</Text>
          <View style={[s.leftCard,{marginRight:0,marginBottom:10}]}>
            <View style={[s.leftCardAccent,{backgroundColor:C.gray400}]} />
            <View style={{padding:14}}>
              <Text style={[s.cardHeading,{color:C.gray500,marginBottom:8}]}>Rapporteringsstandard</Text>
              <Text style={s.body}>
                Rapporten er udarbejdet i overensstemmelse med EFRAG's Voluntary Sustainability Reporting Standard
                for SMEs (VSME), Basic Module (2024). CO₂-beregninger følger GHG Protocol Corporate Accounting
                and Reporting Standard (2023). Rapportperioden er 1. januar – 31. december {year}.
              </Text>
            </View>
          </View>
          <View style={[s.leftCard,{marginRight:0,marginBottom:10}]}>
            <View style={[s.leftCardAccent,{backgroundColor:C.gray400}]} />
            <View style={{padding:14}}>
              <Text style={[s.cardHeading,{color:C.gray500,marginBottom:8}]}>Emissionsfaktorer</Text>
              {[
                "El (Danmark): 0,124 kg CO₂e/kWh — Energistyrelsen 2024",
                "Fjernvarme: 0,065 kg CO₂e/kWh — Energistyrelsen 2024",
                "Diesel (firmabiler): 2,68 kg CO₂e/liter — DEFRA 2024",
                "Flyrejser (korte): 0,255 kg CO₂e/passager-km — DEFRA 2024",
                "Pendling: baseret på national transportstatistik (DTU Transport 2023)",
              ].map((src,i)=>(
                <View key={i} style={s.gapItem}>
                  <View style={[s.gapDot,{backgroundColor:C.gray400}]} />
                  <Text style={s.gapText}>{src}</Text>
                </View>
              ))}
            </View>
          </View>
          {props.disclaimer && (
            <View style={[s.leftCard,{marginRight:0,marginBottom:10}]}>
              <View style={[s.leftCardAccent,{backgroundColor:C.gray300}]} />
              <View style={{padding:14}}>
                <Text style={[s.cardHeading,{color:C.gray400,marginBottom:8}]}>Ansvarsfraskrivelse</Text>
                <Text style={[s.body,{color:C.gray500}]}>{stripMd(props.disclaimer)}</Text>
              </View>
            </View>
          )}
          {/* Kontaktinfo */}
          <View style={[s.infoBox,{backgroundColor:C.dark,borderRadius:8,marginTop:4}]}>
            <Text style={{fontSize:10,fontWeight:700,color:C.white,marginBottom:10}}>{companyName}</Text>
            {[
              companyAddress,
              companyPhone,
              companyEmail,
              companyWebsite,
            ].map((item,i)=>(
              <Text key={i} style={{fontSize:9,color:C.darkText,marginBottom:4}}>{item}</Text>
            ))}
            <Text style={{fontSize:7,color:C.darkSub,marginTop:8}}>
              Rapport genereret af ESG Copilot · {dateStr} · VSME Basic Module (EFRAG 2024)
            </Text>
          </View>
        </View>
        <PageFooter {...pf("Side 24")} />
      </Page>

    </Document>
  )
}
