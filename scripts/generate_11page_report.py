import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header_footer(doc):
    for s in doc.sections:
        s.different_first_page_header_footer = True
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("RouteOptimaAI — AI & DAA Delivery Route Optimization System")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(120, 120, 120)

        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("B.Tech Project Report | Design & Analysis of Algorithms (DAA)")
        frun.font.name = "Times New Roman"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(120, 120, 120)

def create_11page_docx(output_path):
    doc = docx.Document()
    
    # Page setup: A4, 0.75-inch margins for balanced 11-page layout
    for section in doc.sections:
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    add_header_footer(doc)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(3)

    NAVY = RGBColor(16, 44, 87)
    DARK_BLUE = RGBColor(26, 72, 130)
    BODY_COLOR = RGBColor(40, 40, 40)

    def p(text="", bold=False, italic=False, size=Pt(10.5), color=BODY_COLOR, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=Pt(0), space_after=Pt(3), line_spacing=1.15):
        par = doc.add_paragraph()
        par.alignment = align
        par.paragraph_format.space_before = space_before
        par.paragraph_format.space_after = space_after
        par.paragraph_format.line_spacing = line_spacing
        if text:
            run = par.add_run(text)
            run.font.name = "Times New Roman"
            run.font.bold = bold
            run.font.italic = italic
            run.font.size = size
            run.font.color.rgb = color
        return par

    def h1(title):
        return p(title, bold=True, size=Pt(14), color=NAVY, space_before=Pt(6), space_after=Pt(3))

    def h2(title):
        return p(title, bold=True, size=Pt(11.5), color=DARK_BLUE, space_before=Pt(4), space_after=Pt(2))

    # ==========================================
    # PAGE 1: TITLE PAGE
    # ==========================================
    p("", space_before=Pt(40))
    p("A PROJECT REPORT ON", bold=True, size=Pt(12), color=DARK_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER)
    p("AI-Based Complexity-Aware Delivery Route Optimization System", bold=True, size=Pt(20), color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=Pt(10), space_after=Pt(4))
    p("(RouteOptimaAI)", bold=True, size=Pt(16), color=DARK_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(25))
    
    p("Submitted in Partial Fulfillment of the Requirements for the Course of", italic=True, size=Pt(11), align=WD_ALIGN_PARAGRAPH.CENTER)
    p("DESIGN AND ANALYSIS OF ALGORITHMS (DAA) / ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", bold=True, size=Pt(12), color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(35))

    p("—" * 35, align=WD_ALIGN_PARAGRAPH.CENTER, color=RGBColor(180, 180, 180), space_after=Pt(30))

    p("Submitted By:", bold=True, size=Pt(11.5), color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    p("YUG SHAH", bold=True, size=Pt(14), align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Lead Developer | GitHub: YugShah17", italic=True, size=Pt(10.5), align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Bachelor of Technology (B.Tech) in Computer Science & Engineering (AI & ML)", size=Pt(11), align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Third Year Undergraduate Project Submission", size=Pt(10.5), align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(35))

    p("Department of Computer Science and Engineering", bold=True, size=Pt(12), color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Academic Year: 2026 – 2027", size=Pt(11), align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Centering on Urban Last-Mile Logistics in Pune, Maharashtra, India", italic=True, size=Pt(10), align=WD_ALIGN_PARAGRAPH.CENTER)

    doc.add_page_break()

    # ==========================================
    # PAGE 2: TABLE OF CONTENTS & ABSTRACT
    # ==========================================
    h1("Table of Contents")
    toc_table = doc.add_table(rows=10, cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_items = [
        ("1. Abstract", "Page 2"),
        ("2. Introduction (Background, Problem, Proposed System, Scope, Motivation)", "Page 3"),
        ("3. Objectives (10 Core Engineering Objectives)", "Page 3"),
        ("4. Tools and Technologies Used (Frontend, Backend, ML, DB, Routing, DAA)", "Page 4"),
        ("5. Methodology Part 1: Workflow, Data Schema & Greedy Nearest Neighbor", "Page 5"),
        ("6. Methodology Part 2: Local Search 2-Opt, Genetic Algorithm & Hybrid Optimizer", "Page 6"),
        ("7. Methodology Part 3: Constraints, System Architecture & DAA Complexities", "Page 7"),
        ("8. Results Part 1: Functional Tests, Algorithm Comparison & Quantitative Benchmarks", "Page 8"),
        ("9. Results Part 2: Application UI Screenshots & Discussion of Findings", "Page 9"),
        ("10. Advantages, Limitations, Future Scope & Conclusion", "Pages 10–11")
    ]
    for idx, (title, pg) in enumerate(toc_items):
        r = toc_table.rows[idx]
        r.cells[0].paragraphs[0].text = title
        r.cells[0].paragraphs[0].runs[0].font.name = "Times New Roman"
        r.cells[0].paragraphs[0].runs[0].font.size = Pt(9.5)
        r.cells[1].paragraphs[0].text = pg
        r.cells[1].paragraphs[0].paragraphs_format = WD_ALIGN_PARAGRAPH.RIGHT if hasattr(r.cells[1].paragraphs[0], 'paragraphs_format') else None
        r.cells[1].paragraphs[0].runs[0].font.name = "Times New Roman"
        r.cells[1].paragraphs[0].runs[0].font.size = Pt(9.5)
        r.cells[1].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

    p("", space_after=Pt(6))
    h1("1. Abstract")
    p("Last-mile delivery route planning is one of the most operationally challenging and computationally expensive components of commercial supply chains. Inefficient manual scheduling creates redundant travel mileage, sub-optimal vehicle capacity utilization, elevated carbon emissions, and frequent delivery time window violations. Mathematically framed as the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW), finding optimal multi-vehicle delivery schedules is strongly NP-hard.")
    p("To resolve this challenge, RouteOptimaAI introduces an AI-based, complexity-aware dispatch and decision-support system. Rather than forcing every delivery problem through a single static algorithm, the system dynamically assesses the structural complexity of each routing scenario—quantifying order volume, vehicle capacity tightness, priority ratios, time-window deadlines, and spatial dispersion across Pune, Maharashtra, India. An explainable, 100% local Scikit-Learn Random Forest classifier evaluates these complexity features to recommend the most suitable solver: Greedy Nearest Neighbor for rapid heuristic construction, Local Search (2-Opt and order relocation) for iterative neighborhood improvement, Genetic Algorithm for global population exploration, or a Hybrid Metaheuristic (Genetic + 2-Opt) for complex scenarios. A deterministic safety arbiter guarantees that physical vehicle payload capacities are respected and no orders are omitted or duplicated.")
    p("RouteOptimaAI integrates a modern React 19 single-page dashboard with an interactive Leaflet mapping engine, a high-performance Python FastAPI backend, SQLite/PostgreSQL persistence, and live bi-directional WebSocket telemetry (`/ws/live`). Routing is powered by OpenStreetMap Nominatim geocoding, OSRM road network polylines, and intelligent caching with road-curvature fallbacks. Empirical benchmarking across scenarios from 10 to 80 orders proves that while Greedy executes instantaneously (< 0.001 s), Local Search and Hybrid eliminate late deliveries entirely (dropping late orders from 17 down to 0 at 80 orders). All 19 automated unit and integration tests pass successfully, confirming system stability and educational rigor.")

    doc.add_page_break()

    # ==========================================
    # PAGE 3: INTRODUCTION & OBJECTIVES
    # ==========================================
    h1("2. Introduction")
    h2("2.1 Background")
    p("Last-mile logistics accounts for over 40% to 50% of total transportation costs in commercial logistics. In modern urban delivery operations, a fleet of vehicles with finite payload capacities must depart from central depots to deliver packages across dense, traffic-heavy metropolitan areas. Dispatchers face two critical combinatorial challenges: (1) Fleet Clustering (assigning orders to vehicles without exceeding capacities), and (2) Route Sequencing (ordering customer visits to minimize total distance while satisfying delivery time windows).")
    
    h2("2.2 Problem Statement")
    p("Manual planning fails because the candidate route space grows factorially: for n customers and m vehicles, the search space is O(m^n · n!). Real delivery operations impose competing constraints: vehicle capacities cannot be breached, urgent parcels must be expedited, and time windows must be met. Furthermore, myopic decisions—such as visiting the nearest customer first—frequently strand subsequent deliveries at extreme geographical peripheries, causing long, cross-town return trips with empty vehicles.")

    h2("2.3 Proposed System")
    p("RouteOptimaAI provides an automated, complexity-aware route planning architecture. It combines four distinct Design and Analysis of Algorithms (DAA) solvers, an 8-feature machine learning strategy classifier, OpenStreetMap spatial integration, and an interactive web dashboard with real-time WebSocket vehicle simulation.")

    h2("2.4 Scope of the Project")
    p("The implemented system supports multi-vehicle CVRPTW routing, address geocoding across Pune, four optimization algorithms, live GPS simulation, Before vs After analytics, and comprehensive REST APIs. Live hardware OBD-II GPS tracking and dynamic en-route re-optimization remain future extensions.")

    h2("2.5 Motivation")
    p("This project demonstrates practical synergy between theoretical algorithm design (greedy heuristics, local search, genetic metaheuristics) and applied machine learning (scenario classification), providing significant logistical, educational, and environmental value.")

    h1("3. Objective")
    objectives = [
        "1. Automate Last-Mile Scheduling: Eliminate manual route guesswork with an automated mathematical planning pipeline.",
        "2. Implement 4 DAA Solvers: Construct and benchmark Greedy Nearest Neighbor, Local Search (2-Opt), Genetic Algorithm, and Hybrid Optimizer.",
        "3. Explainable ML Selection: Integrate a 100% local Random Forest model to recommend solvers with human-readable rationale.",
        "4. Enforce Physical Feasibility: Implement a RouteEvaluator checking capacity limits, arrival times, and duplicate order prevention.",
        "5. Automatic Geocoding: Enable plain address import without pre-existing coordinates using Nominatim and a verified Pune directory.",
        "6. Real Road Network Routing: Connect with OSRM to generate genuine turn-by-turn road polyline geometries rather than straight lines.",
        "7. Interactive Web Dashboard: Build a React 19 interface with multi-vehicle colored Leaflet routes and Before vs After analytics.",
        "8. Real-Time Telemetry Simulation: Stream live simulated vehicle coordinates, speeds, and stop completions over WebSockets (/ws/live).",
        "9. Maintain Rigorous Verification: Pass 19 automated Pytest unit and integration tests covering API, ML, geocoding, and solvers.",
        "10. Empirical Benchmarking: Document quantitative runtime, distance, and constraint metrics across 10, 20, 50, and 80 order instances."
    ]
    for obj in objectives:
        p(obj, size=Pt(9.5), space_after=Pt(1.5))

    doc.add_page_break()

    # ==========================================
    # PAGE 4: TOOLS AND TECHNOLOGIES USED
    # ==========================================
    h1("4. Tools and Technologies Used")
    h2("4.1 Frontend Technologies")
    p("The user interface is built with React 19 (concurrent rendering, hooks), Vite 8.3.0 (fast ES module bundling), Leaflet 1.9.4 and React-Leaflet 5.0.0 (interactive map rendering, custom SVG markers, multi-vehicle polyline layers), Lucide React (scalable UI iconography), and a custom Vanilla CSS design system (dark palette #0e1117, responsive flex/grid layouts) avoiding bloated external CSS libraries.")

    h2("4.2 Backend Technologies")
    p("The server layer uses Python 3.10+ (tested on Python 3.14), FastAPI 0.115+ (asynchronous REST endpoints, automatic OpenAPI documentation at /docs), Uvicorn 0.30+ (high-concurrency ASGI server), Pydantic v2.8+ (strict request/response data validation), WebSockets 12.0+ (full-duplex persistent telemetry streaming at /ws/live), and HTTPX (asynchronous external HTTP client).")

    h2("4.3 Machine Learning Technologies")
    p("The strategy selection engine uses Scikit-Learn 1.5+ (RandomForestClassifier, 120 estimators, max depth 10, balanced class weights), Pandas 2.2+ and NumPy 1.26+ (data manipulation and array processing), and Joblib (model persistence). The model achieves 85.00% accuracy and 82.54% weighted F1-score across 8 features (order count, vehicles, constraints, average distance, geographic spread, priority ratio, time window ratio, and capacity utilization). It operates 100% locally without external LLM dependencies.")

    h2("4.4 Database and Storage")
    p("Relational storage is implemented via SQLAlchemy 2.0+ ORM with SQLite (delivery.db) for local execution, ready for PostgreSQL in production. Ten database entities persist the logistics state:")

    # Table of Tech
    tech_table = doc.add_table(rows=6, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_data = [
        ("Technology / Entity", "Responsibility & Purpose", "Verified Module / File"),
        ("SQLite / SQLAlchemy", "Relational persistence of fleet, orders, routes, runs", "backend/app/database.py"),
        ("Order & Customer Models", "Stores recipient addresses, package weights, time windows", "backend/app/models/entities.py"),
        ("Vehicle & Location Models", "Maintains fleet payload limits, assigned routes, live GPS breadcrumbs", "backend/app/models/entities.py"),
        ("Route & RouteStop Models", "Persists chronological delivery stops, arrival ETAs, road polylines", "backend/app/models/entities.py"),
        ("OptimizationRun & Cache", "Records run diagnostics, complexity scores, OSRM matrix cache", "backend/app/models/entities.py")
    ]
    for r_idx, row in enumerate(tech_data):
        for c_idx, val in enumerate(row):
            cell = tech_table.rows[r_idx].cells[c_idx]
            cell.text = val
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if r_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                set_cell_background(cell, "EAEAEA")
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)

    p("", space_after=Pt(4))
    h2("4.5 Routing, Geocoding & Development Tools")
    p("Spatial intelligence connects to OpenStreetMap Nominatim for geocoding and OSRM for road network driving paths. An in-memory dictionary of 40+ Pune localities and 20+ PIN codes ensures instant offline address resolution. Pytest 8.0+ executes 19 automated tests; Git manages version control.")

    doc.add_page_break()

    # ==========================================
    # PAGE 5: METHODOLOGY (PART 1 - WORKFLOW, DATA & GREEDY)
    # ==========================================
    h1("5. Methodology (Approach)")
    h2("5.1 Overall Workflow")
    p("RouteOptimaAI processes deliveries through a structured 10-step pipeline: (1) Dispatcher enters orders or uploads a batch CSV; (2) Backend validates fields, positive weights, and priorities; (3) Geocoding service resolves coordinates via Pune dictionary or Nominatim; (4) Spatial service constructs NxN distance/duration matrix with road curvature adjustments; (5) Complexity service extracts 8 normalized features; (6) Random Forest classifier predicts the optimal solver; (7) Safety arbiter verifies feasibility rules; (8) Designated DAA algorithm optimizes vehicle routes; (9) RouteEvaluator audits costs, time windows, and vehicle capacity; (10) Routes, ETAs, and Before vs After metrics are stored and rendered on the Leaflet map.")

    h2("5.2 Input Data & Validation")
    p("Orders require: order code, customer name, address, area, PIN code, package weight (kg), priority (LOW, NORMAL, HIGH, URGENT), and time windows. Coordinates are automatically geocoded, preventing user burden.")

    # Sample Table
    sample_table = doc.add_table(rows=5, cols=6)
    sample_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    s_data = [
        ("Order ID", "Customer Name", "Address / Locality", "Weight", "Priority", "Time Window"),
        ("ORD001", "Aarav Sharma", "Baner Road, Baner", "2.5 kg", "HIGH", "10:00 – 12:00"),
        ("ORD002", "Priya Deshmukh", "Wakad Hinjewadi Rd", "1.8 kg", "NORMAL", "12:00 – 14:00"),
        ("ORD003", "Rohan Kulkarni", "Aundh D-Mart, Aundh", "3.2 kg", "HIGH", "14:00 – 16:00"),
        ("ORD004", "Sneha Patil", "Kothrud Vanaz Corner", "4.0 kg", "NORMAL", "11:00 – 15:00")
    ]
    for r_idx, row in enumerate(s_data):
        for c_idx, val in enumerate(row):
            cell = sample_table.rows[r_idx].cells[c_idx]
            cell.text = val
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if r_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                set_cell_background(cell, "EAEAEA")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    p("", space_after=Pt(4))
    h2("5.3 Data Validation & Resilient Preparation")
    p("Validation enforces: weight > 0, non-empty addresses, and valid time windows. Unlocated addresses are marked FAILED—the system never invents fake coordinates. Unlocated orders are isolated from the routing pool.")

    h2("5.4 Greedy Nearest Neighbor Heuristic")
    p("Greedy builds tours starting at the depot, iteratively appending the nearest unvisited order whose weight fits vehicle capacity. Perceived distance is weighted by priority multipliers: URGENT (0.70x), HIGH (0.85x), NORMAL (1.0x), and LOW (1.15x), biasing the search to serve critical orders sooner.")

    p("Pseudocode: Greedy Nearest Neighbor", bold=True, size=Pt(9), color=NAVY)
    greedy_code = (
        "Algorithm Greedy_CVRPTW(Orders, Vehicles, DistMatrix):\n"
        "  Unvisited = {1, 2, ..., N}; Routes = [[] for v in Vehicles]\n"
        "  For v in Vehicles:\n"
        "    CurrLoad = 0; CurrLoc = DEPOT\n"
        "    While Unvisited:\n"
        "      Candidate = argmin_{i in Unvisited} (DistMatrix[CurrLoc][i] * PriorityMultiplier(i))\n"
        "      If CurrLoad + Weight(Candidate) <= Capacity(v):\n"
        "        Append Candidate to Routes[v]; Unvisited.remove(Candidate)\n"
        "        CurrLoad += Weight(Candidate); CurrLoc = Location(Candidate)\n"
        "      Else: Break to next vehicle\n"
        "  For each remaining order in Unvisited: Assign to vehicle with minimum overload\n"
        "  Return Routes  // Time Complexity: O(K * N^2), Space Complexity: O(N)"
    )
    p(greedy_code, size=Pt(8), italic=True, color=RGBColor(50, 50, 50), space_before=Pt(2), space_after=Pt(4))

    doc.add_page_break()

    # ==========================================
    # PAGE 6: METHODOLOGY (PART 2 - METAHEURISTICS & ML CLASSIFIER)
    # ==========================================
    h2("5.5 Local Search: 2-Opt and Order Relocation")
    p("Local Search refines an existing solution through intra-route and inter-route improvements:")
    p("1. Intra-Route 2-Opt Edge Inversion: Reverses intermediate sub-tours between stops i and j: NewRoute = (v_0...v_i) + (v_j...v_{i+1}) + (v_{j+1}...v_m). Reconnecting edges eliminates crossed paths whenever CostDelta < -1e-4.")
    p("2. Intra-Route 1-Opt Insertion: Relocates single deliveries along the same vehicle tour to improve time window alignment.")
    p("3. Inter-Route Relocation: Shifts an order from Vehicle v1 to Vehicle v2 if v2 has surplus payload capacity and the net combined cost delta is negative. Iterates until convergence or budget limit (max 150 iterations).")

    h2("5.6 Genetic Algorithm (Metaheuristic)")
    p("A population-based evolutionary metaheuristic exploring global route ordering combinations:")
    p("• Chromosome Representation: Permutation of all N order indices [o_1, o_2, ..., o_N].")
    p("• Greedy Capacity Decoder: Decodes permutations by placing each order on the least-loaded vehicle with sufficient capacity.")
    p("• Fitness Function: Inversely proportional to objective cost: Fitness = 1.0 / (TotalCost + 1e-4).")
    p("• Selection & Elitism: Tournament selection (k=3); preserves top 2 elite chromosomes directly into the next generation.")
    p("• Order Crossover (OX): Copies a slice from Parent 1 and fills remaining positions in Parent 2 sequence without duplicates.")
    p("• Mutation (Rate = 0.20): 50% probability of Swap Mutation; 50% probability of Inversion Mutation.")

    h2("5.7 Hybrid Algorithm (Genetic + 2-Opt)")
    p("A cooperative metaheuristic combining global exploration with targeted local exploitation. Phase 1 runs the Genetic Algorithm for 80% of the allocated time budget to discover high-quality global clustering. Phase 2 seeds the best chromosome into Local Search for the remaining 20% budget, performing 2-opt edge untangling.")

    h2("5.8 Machine Learning Complexity-Aware Selection")
    p("The ComplexityService calculates a normalized Complexity Score (0–100) combining four weighted factors: (1) Order volume scale (up to 40 pts), (2) Fleet capacity tightness (up to 15 pts), (3) Constraint density (up to 20 pts), and (4) Spatial dispersion (up to 25 pts). Scores < 40 are LOW, 40–70 are MEDIUM, and > 70 are HIGH.")
    p("The Random Forest classifier evaluates the 8-feature vector and outputs strategy probabilities. The Safety Arbiter applies deterministic rules: problems with <= 6 orders are forced to GREEDY (avoiding overhead); problems with Score >= 75 and >= 25 orders upgrade to HYBRID.")

    doc.add_page_break()

    # ==========================================
    # PAGE 7: METHODOLOGY (PART 3 - CONSTRAINTS, ARCHITECTURE & COMPLEXITY)
    # ==========================================
    h2("5.10 Route Evaluation and Mathematical Objective Function")
    p("The unified RouteEvaluator scores candidate solutions using a weighted multi-objective function with penalty barriers:")
    p("min Cost = w_dist · Dist_total + w_time · Time_travel + P_late · N_late + P_cap · V_cap + P_unassigned · N_unassigned + P_dup · N_dup", bold=True, size=Pt(9.5), color=NAVY, align=WD_ALIGN_PARAGRAPH.CENTER)
    p("Default parameters: w_dist = 1.0, w_time = 0.2, P_late = 50.0 per late order, P_cap = 1000.0 per kg overloaded, P_unassigned = 5000.0, P_dup = 5000.0, Depot start = 09:00 AM (540 min), Service time = 5.0 min per customer. A solution is marked feasible if and only if V_cap == 0, N_unassigned == 0, and N_dup == 0.")

    h2("5.11 System Architecture Overview")
    p("The system architecture follows a clean multi-tier decoupling: (1) Presentation Layer: React 19 single-page application with Leaflet mapping; (2) Service & API Layer: FastAPI REST endpoints and WebSocket live broadcast; (3) Spatial Engine: OSRM road geometry builder, Nominatim geocoder, and caching layer; (4) Intelligence Engine: Complexity analyzer, Random Forest classifier, and DAA solver suite; (5) Persistence Layer: SQLite/PostgreSQL relational database.")

    h2("5.12 Time and Space Complexity Analysis")
    p("Theoretical asymptotic bounds compared with empirical runtimes at N = 80 orders across 10 vehicles:")

    # Table of Complexity
    comp_table = doc.add_table(rows=5, cols=5)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_data = [
        ("Algorithm", "Time Complexity", "Space Complexity", "Parameters Defined", "Runtime (N=80)"),
        ("Greedy Nearest Neighbor", "O(K · N^2)", "O(N)", "N orders, K vehicles", "< 0.001 s"),
        ("Local Search (2-Opt & Reloc)", "O(I · K^2 · N^2)", "O(N)", "I iterations (I <= 150)", "2.100 s"),
        ("Genetic Algorithm", "O(G · P · N)", "O(P · N)", "P population (50), G gen (80)", "0.290 s"),
        ("Hybrid (Genetic + 2-Opt)", "O(G·P·N + I·N^2)", "O(P · N)", "80% time GA, 20% time 2-Opt", "2.450 s")
    ]
    for r_idx, row in enumerate(c_data):
        for c_idx, val in enumerate(row):
            cell = comp_table.rows[r_idx].cells[c_idx]
            cell.text = val
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if r_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                set_cell_background(cell, "EAEAEA")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    p("", space_after=Pt(4))
    p("Complexity Insights: Greedy offers sub-millisecond execution because it never backtracks, but produces sub-optimal tours. Local Search scales with improvement iterations I. Genetic Algorithm runtime is strictly bounded by generation budget G and population P. Hybrid balances global exploration with local edge inversion, remaining well within operational interactive limits (< 2.5 s for 80 orders).")

    doc.add_page_break()

    # ==========================================
    # PAGE 8: RESULTS (PART 1 - BENCHMARKS & DISCUSSION)
    # ==========================================
    h1("6. Results")
    h2("6.1 Functional Results")
    p("RouteOptimaAI was verified against 19 automated Pytest unit and integration tests (19 passed, 0 failed). All core operational flows function reliably: CSV import, Pune geocoding, complexity analysis, strategy selection, multi-vehicle routing, Before vs After analytics, and live WebSocket telemetry.")

    h2("6.2 Algorithm Comparison Matrix")
    p("The four implemented algorithms exhibit distinct engineering trade-offs across solution quality, execution time, and constraint handling:")

    # Table of Comparison
    matrix_table = doc.add_table(rows=5, cols=5)
    matrix_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_data = [
        ("Metric / Dimension", "Greedy Nearest Neighbor", "Local Search (2-Opt)", "Genetic Algorithm", "Hybrid Optimizer"),
        ("Search Paradigm", "Constructive heuristic", "Neighborhood search", "Evolutionary metaheuristic", "Cooperative hybrid"),
        ("Distance Quality", "Sub-optimal (crossings)", "High (untangled loops)", "Good to Very High", "Highest & Most Consistent"),
        ("Late Delivery Rate", "High under tight windows", "Zero / Minimal", "Low", "Zero / Eliminated"),
        ("Best Problem Scale", "N <= 10 or emergencies", "10 < N <= 30 orders", "N > 30 broad search", "Large constrained fleets")
    ]
    for r_idx, row in enumerate(m_data):
        for c_idx, val in enumerate(row):
            cell = matrix_table.rows[r_idx].cells[c_idx]
            cell.text = val
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if r_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                set_cell_background(cell, "EAEAEA")
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)

    p("", space_after=Pt(4))
    h2("6.3 Quantitative Benchmark Results")
    p("The following quantitative measurements reflect exact empirical benchmarks recorded from backend/experiments/run_benchmark.py and stored in data/benchmark_results.csv:")

    bench_table = doc.add_table(rows=9, cols=7)
    bench_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    b_data = [
        ("Size", "Vehicles", "Algorithm", "Distance (km)", "Runtime (s)", "Late Orders", "Total Cost"),
        ("10 Orders", "2", "GREEDY", "154.64 km", "0.000 s", "0", "207.66"),
        ("10 Orders", "2", "HYBRID", "148.70 km", "0.101 s", "0", "199.69"),
        ("20 Orders", "2", "GREEDY", "196.57 km", "0.000 s", "4", "463.96"),
        ("20 Orders", "2", "HYBRID", "210.52 km", "0.256 s", "0", "282.70"),
        ("50 Orders", "6", "GREEDY", "396.97 km", "0.000 s", "17", "1383.07"),
        ("50 Orders", "6", "HYBRID", "406.53 km", "1.632 s", "0", "545.92"),
        ("80 Orders", "10", "GREEDY", "576.11 km", "0.001 s", "17", "1623.64"),
        ("80 Orders", "10", "HYBRID", "576.46 km", "2.450 s", "0", "774.08")
    ]
    for r_idx, row in enumerate(b_data):
        for c_idx, val in enumerate(row):
            cell = bench_table.rows[r_idx].cells[c_idx]
            cell.text = val
            cell.paragraphs[0].runs[0].font.name = "Times New Roman"
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            if r_idx == 0:
                cell.paragraphs[0].runs[0].font.bold = True
                set_cell_background(cell, "EAEAEA")
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)

    p("", space_after=Pt(4))
    h2("6.5 Results Discussion")
    p("The benchmark data reveals the 'Greedy Distance Illusion': for 80 orders, Greedy achieves 576.11 km but violates 17 time windows, inflating total cost to 1623.64. Hybrid achieves 576.46 km with 0 late deliveries, lowering total cost to 774.08 (a 52.3% cost reduction). This justifies the ML complexity arbiter: small instances run instantly via Greedy, while complex fleets receive metaheuristic refinement.")

    doc.add_page_break()

    # ==========================================
    # PAGE 9: RESULTS (PART 2 - SCREENSHOTS)
    # ==========================================
    h2("6.4 Verified Application Interface Screenshots")
    p("The following genuine UI screenshots demonstrate RouteOptimaAI executing with realistic logistics data in Pune, India:")

    assets_dir = os.path.join("docs", "assets")
    
    # 2 Figures per page layout (compact heights ~2.1 inches each)
    fig1_path = os.path.join(assets_dir, "figure1_dashboard.png")
    if os.path.exists(fig1_path):
        p_img1 = doc.add_paragraph()
        p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img1.paragraph_format.space_before = Pt(2)
        p_img1.paragraph_format.space_after = Pt(2)
        p_img1.add_run().add_picture(fig1_path, width=Inches(6.2), height=Inches(2.1))
        p("Figure 1: Main Logistics Dashboard — displaying active fleet utilization gauges, order status cards, and operational summaries.", italic=True, size=Pt(8.5), align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(8))

    fig4_path = os.path.join(assets_dir, "figure4_route_results.png")
    if os.path.exists(fig4_path):
        p_img2 = doc.add_paragraph()
        p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img2.paragraph_format.space_before = Pt(2)
        p_img2.paragraph_format.space_after = Pt(2)
        p_img2.add_run().add_picture(fig4_path, width=Inches(6.2), height=Inches(2.1))
        p("Figure 2: Route Optimization Results & Multi-Vehicle Leaflet Map — showing Before vs After metrics, stop sequences, and road paths in Pune.", italic=True, size=Pt(8.5), align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(8))

    fig3_path = os.path.join(assets_dir, "figure3_optimization_config.png")
    if os.path.exists(fig3_path):
        p_img3 = doc.add_paragraph()
        p_img3.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img3.paragraph_format.space_before = Pt(2)
        p_img3.paragraph_format.space_after = Pt(2)
        p_img3.add_run().add_picture(fig3_path, width=Inches(6.2), height=Inches(2.1))
        p("Figure 3: Complexity Analysis & Strategy Selection — illustrating calculated complexity score (54.5, MEDIUM) and explainable ML recommendation.", italic=True, size=Pt(8.5), align=WD_ALIGN_PARAGRAPH.CENTER, space_after=Pt(4))

    doc.add_page_break()

    # ==========================================
    # PAGE 10: ADVANTAGES, LIMITATIONS & FUTURE SCOPE
    # ==========================================
    h1("7. Advantages")
    advantages = [
        "1. Automated End-to-End Scheduling: Eliminates error-prone manual dispatching via an automated mathematical pipeline.",
        "2. Dynamic Complexity Awareness: Recommends the optimal solver rather than forcing every scenario through a single static algorithm.",
        "3. Multi-Constraint Enforcement: Simultaneously respects vehicle payload limits, delivery priorities, and customer time windows.",
        "4. Local, Zero-Cost ML Inference: Runs 100% offline via Scikit-Learn without expensive or unpredictable cloud AI APIs.",
        "5. Real Road Network Routing: Employs OSRM to generate turn-by-turn driving polylines rather than straight-line flyover paths.",
        "6. High Geocoding Resilience: Features a 40+ Pune locality directory ensuring instant offline address resolution.",
        "7. Full Audit Logging: Persists every optimization run, complexity score, and performance metric for operational accountability.",
        "8. Real-Time Telemetry Simulation: Streams live vehicle coordinates, speeds, and stop arrivals via WebSockets.",
        "9. Modern Interactive Dashboard: Provides fleet managers with clear utilization gauges and Before vs After comparison analytics.",
        "10. High Extensibility: Modular architecture allows seamless integration of new solvers, penalty weights, or routing providers."
    ]
    for adv in advantages:
        p(adv, size=Pt(9), space_after=Pt(1.5))

    p("", space_after=Pt(4))
    h1("8. Limitations")
    limitations = [
        "1. Heuristic Non-Optimality: As CVRPTW is NP-hard, solvers provide high-quality approximations rather than proven global optima.",
        "2. Static Batch Formulation: Optimizes discrete batches; en-route additions require triggering a new optimization run.",
        "3. External Rate Limits: Public OSRM/Nominatim servers have rate limits (mitigated by local matrix caching and fallbacks).",
        "4. Approximated Traffic Speeds: Travel time assumes 35 km/h urban speed with 1.3x road tortuosity; live traffic feeds are not connected.",
        "5. Single-Depot Centralization: Current algorithms assume vehicles depart and return to a single central depot per optimization run.",
        "6. Synthetic ML Dataset: Classifier was trained on 500 simulated scenarios; abnormal real-world clustering may require retraining.",
        "7. Simulated Telemetry: Vehicle tracking uses an asyncio trajectory interpolator rather than physical cellular OBD-II GPS units."
    ]
    for lim in limitations:
        p(lim, size=Pt(9), space_after=Pt(1.5))

    p("", space_after=Pt(4))
    h1("9. Future Scope")
    future_scope = [
        "1. Dynamic Real-Time Rerouting: Event-driven re-optimization as new emergency orders arrive while vehicles are en route.",
        "2. Live Traffic Ingestion: Connect Google Maps or TomTom Traffic APIs to incorporate real-time road congestion into travel times.",
        "3. Physical IoT GPS Trackers: Integrate cellular OBD-II vehicle tracking hardware via the authenticated REST endpoint.",
        "4. Multi-Depot Fleet Routing: Extend algorithms to support multi-warehouse distribution networks and cross-docking hubs.",
        "5. Multi-Objective Pareto Optimization: Implement NSGA-II to compute Pareto frontiers balancing fuel consumption and overtime.",
        "6. Electric Vehicle Constraints: Model battery discharge curves, state-of-charge limits, and intermediate charging station stops.",
        "7. Deep Reinforcement Learning: Train policy-gradient neural networks to learn constructive heuristics from historical dispatch data.",
        "8. Driver Mobile App: Build a companion React Native / Flutter app for turn-by-turn navigation and digital proof-of-delivery.",
        "9. Automated ML Retraining: Automatically retrain the Random Forest model as operational audit logs accumulate in the database.",
        "10. Cloud Containerization: Package services with Docker and Kubernetes for high-availability automated deployment."
    ]
    for fut in future_scope:
        p(fut, size=Pt(9), space_after=Pt(1.5))

    doc.add_page_break()

    # ==========================================
    # PAGE 11: CONCLUSION & VIVA PREPARATION
    # ==========================================
    h1("10. Conclusion")
    p("RouteOptimaAI successfully bridges theoretical algorithm design from Design and Analysis of Algorithms (DAA) with production software engineering and applied machine learning. By tackling the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW), the project solves a critical operational challenge in urban logistics.")
    p("The system's core contribution lies in its complexity-aware dispatch architecture: rather than treating optimization as a static choice, an explainable Random Forest classifier assesses scenario dimensionality, fleet tightness, and spatial dispersion to select the most effective algorithm. Empirical testing confirms that while constructive Greedy heuristics execute in under 1 ms, Local Search and Hybrid metaheuristics eliminate late delivery penalties entirely, cutting total operational costs by over 52% on complex 80-order instances. The full-stack implementation—combining React 19, Leaflet maps, FastAPI, SQLite/PostgreSQL, OSRM routing, and WebSocket telemetry—provides a robust, educational, and commercially viable platform for modern last-mile logistics.")

    p("", space_after=Pt(4))
    h1("References & Literature")
    refs = [
        "[1] Dantzig, G. B., & Ramser, J. H. (1959). The Truck Dispatching Problem. Management Science, 6(1), 80-91.",
        "[2] Clarke, G., & Wright, J. W. (1964). Scheduling of Vehicles from a Central Depot to Delivery Points. Oper. Res., 12(4), 568-581.",
        "[3] Croes, G. A. (1958). A Method for Solving Traveling-Salesman Problems. Oper. Res., 6(6), 791-812. (Introduction of 2-Opt).",
        "[4] Goldberg, D. E. (1989). Genetic Algorithms in Search, Optimization, and Machine Learning. Addison-Wesley.",
        "[5] Toth, P., & Vigo, D. (2014). Vehicle Routing: Problems, Methods, and Applications (2nd ed.). SIAM.",
        "[6] Project OSRM. (2026). Open Source Routing Machine Documentation. https://project-osrm.org/",
        "[7] OpenStreetMap Nominatim. (2026). Nominatim Geocoding API Documentation. https://nominatim.org/",
        "[8] Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. JMLR, 12, 2825-2830."
    ]
    for r in refs:
        p(r, size=Pt(8.5), space_after=Pt(1.5))

    p("", space_after=Pt(4))
    h1("Viva Voce & Technical Defense Key Points")
    viva_points = [
        "• Q: Why not always run the Hybrid Metaheuristic? A: For small fleets (<= 10 orders), Greedy and Local Search find optimal routes in < 0.02s. Running a Genetic population wastes CPU cycles without improving distance.",
        "• Q: Why does Greedy have 17 late deliveries at 80 orders? A: Greedy is myopic; it picks the nearest neighbor spatially without looking ahead at time-window deadlines. Metaheuristics optimize the full global penalty function.",
        "• Q: Why use a local Random Forest instead of an external LLM API? A: Logistics dispatching requires sub-millisecond, deterministic, explainable predictions without recurring API costs, internet dependency, or privacy leaks.",
        "• Q: How does the system handle geocoding failures? A: It fails strictly and sets status='FAILED'. It never invents fake coordinates, ensuring routing integrity.",
        "• Q: How is physical feasibility enforced? A: RouteEvaluator penalizes overloads with 1000/kg and missing orders with 5000/order. Solutions with violations are marked is_feasible=False."
    ]
    for vp in viva_points:
        p(vp, size=Pt(8.5), italic=True, space_after=Pt(1.5))

    doc.save(output_path)
    print(f"Successfully generated 11-page DOCX at: {output_path}")

if __name__ == "__main__":
    out_docx = os.path.join("docs", "RouteOptimaAI_Project_Report.docx")
    create_11page_docx(out_docx)
