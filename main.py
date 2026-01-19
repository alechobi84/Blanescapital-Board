"""
Blanes Capital Dashboard - Flask Application
Para ejecutar en PythonAnywhere
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from io import BytesIO
from datetime import datetime

# ============================================
# CONFIGURACIÓN
# ============================================
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'blanes-capital-secret-key-cambiar-en-produccion')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///blanes.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Por favor, inicia sesión para acceder.'

# ============================================
# MODELOS DE BASE DE DATOS
# ============================================
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ============================================
# RUTAS
# ============================================
@app.route('/')
def index():
    """Página principal - redirige al login si no está autenticado"""
    if current_user.is_authenticated:
        return render_template('index.html')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Página de login"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('dashboard'))
        else:
            flash('Usuario o contraseña incorrectos', 'error')

    return render_template('login.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard principal - requiere autenticación"""
    return render_template('index.html')

@app.route('/logout')
@login_required
def logout():
    """Cerrar sesión"""
    logout_user()
    flash('Has cerrado sesión correctamente', 'success')
    return redirect(url_for('login'))

# ============================================
# DATOS PROTEGIDOS (solo accesibles con login)
# ============================================
PERIOD_DATA = {
    '2024': {
        'title': 'Cierre 2024',
        'date': '31 de diciembre de 2024',
        'total': {
            'bajoGestion': 161.06,
            'rentabilidad': 6.36,
            'rentasInmob': 364,
            'costeEstructura': 0.35,
            'costeEstructuraTotal': 547
        },
        'pablo': {
            'patrimonioTotal': 126.09,
            'bajoGestion': 88.43,
            'empresarial': 37.66,
            'rentabilidad': 5.69,
            'rentasInmob': 186,
            'carteraFinanciera': 46.43,
            'carteraInmobiliaria': 28.0,
            'alternativas': 1.68,
            'rotacion': 3.44,
            'exposicionUSD': 30,
            'rf': 78, 'rv': 18, 'mp': 4,
            'bancos': { 'jp': 58, 'gs': 22, 'march': 13, 'andbank': 7 }
        },
        'ale': {
            'patrimonioTotal': 150.08,
            'bajoGestion': 72.63,
            'empresarial': 77.45,
            'rentabilidad': 7.22,
            'rentasInmob': 178,
            'carteraFinanciera': 34.50,
            'carteraInmobiliaria': 21.16,
            'alternativas': 4.37,
            'rotacion': 3.44,
            'exposicionUSD': 32,
            'rf': 52, 'rv': 45, 'mp': 3,
            'bancos': { 'jp': 64, 'gs': 16, 'andbank': 12, 'march': 8 }
        },
        'estructura': {
            'total': 546915,
            'ratio': 0.35,
            'budget': 543740,
            'mensual': {
                'ene': 45, 'feb': 46, 'mar': 42, 'abr': 45, 'may': 44, 'jun': 48,
                'jul': 46, 'ago': 44, 'sep': 45, 'oct': 47, 'nov': 48, 'dic': 47
            }
        }
    },
    '1s2025': {
        'title': '1er Semestre 2025',
        'date': '30 de junio de 2025',
        'total': {
            'bajoGestion': 175.1,
            'rentabilidad': -0.03,
            'rentasInmob': 748,
            'costeEstructura': 0.33,
            'costeEstructuraTotal': 278
        },
        'pablo': {
            'patrimonioTotal': 128.7,
            'bajoGestion': 96.4,
            'empresarial': 32.3,
            'rentabilidad': -0.14,
            'rentabilidadSinUSD': 3.07,
            'rentasInmob': 385,
            'carteraFinanciera': 55.8,
            'carteraInmobiliaria': 28.0,
            'alternativas': 2.2,
            'rotacion': 3.44,
            'exposicionUSD': 29,
            'ocupacion': 79,
            'rf': 75, 'rv': 21, 'mp': 4,
            'bancos': { 'jp': 60, 'gs': 21, 'march': 12, 'andbank': 7 }
        },
        'ale': {
            'patrimonioTotal': 143.4,
            'bajoGestion': 78.8,
            'empresarial': 64.7,
            'rentabilidad': 0.08,
            'rentabilidadSinUSD': 3.86,
            'rentasInmob': 363,
            'carteraFinanciera': 43.0,
            'carteraInmobiliaria': 21.6,
            'alternativas': 5.4,
            'rotacion': 3.44,
            'exposicionUSD': 27,
            'ocupacion': 88,
            'rf': 50, 'rv': 47, 'mp': 2,
            'bancos': { 'jp': 66, 'gs': 14, 'andbank': 12, 'march': 8 }
        },
        'estructura': {
            'total': 278000,
            'ratio': 0.33,
            'budget': 315000,
            'mensual': {
                'ene': 44, 'feb': 48, 'mar': 40, 'abr': 44, 'may': 40, 'jun': 63
            }
        }
    }
}

HISTORICAL_DATA = {
    'years': ['2020', '2021', '2022', '2023', '2024', '1S 2025'],
    'pablo': {
        'bajoGestion': [111.9, 86.5, 85.0, 87.9, 88.43, 96.4],
        'empresarial': [20.2, 27.5, 43.5, 36.1, 37.66, 32.3]
    },
    'ale': {
        'bajoGestion': [91.2, 67.6, 66.8, 70.0, 72.63, 78.8],
        'empresarial': [40.9, 56.5, 91.8, 74.7, 77.45, 64.7]
    }
}

# ============================================
# API ENDPOINTS PROTEGIDOS
# ============================================
@app.route('/api/user')
@login_required
def api_user():
    """Devuelve información del usuario actual"""
    return {
        'username': current_user.username,
        'email': current_user.email,
        'is_admin': current_user.is_admin
    }

@app.route('/api/data')
@login_required
def api_data():
    """Devuelve todos los datos del dashboard - REQUIERE LOGIN"""
    return {
        'periodData': PERIOD_DATA,
        'historicalData': HISTORICAL_DATA
    }

@app.route('/api/export')
@login_required
def export_data():
    """Exporta los datos con opciones personalizadas - REQUIERE LOGIN"""
    # Obtener parámetros
    formato = request.args.get('format', 'excel')
    periodos = request.args.getlist('periodos') or ['1s2025']
    perfiles = request.args.getlist('perfiles') or ['total']
    secciones = request.args.getlist('secciones') or ['resumen']

    try:
        # Preparar datos según selección
        export_data = prepare_export_data(periodos, perfiles, secciones)

        if formato == 'excel':
            return export_to_excel(export_data, periodos, perfiles)
        elif formato == 'csv':
            return export_to_csv(export_data, periodos, perfiles)
        elif formato == 'pdf':
            return export_to_pdf(export_data, periodos, perfiles)
        else:
            return {'error': 'Formato no soportado'}, 400

    except Exception as e:
        return {'error': str(e)}, 500

def prepare_export_data(periodos, perfiles, secciones):
    """Prepara los datos para exportar según las opciones seleccionadas"""
    data = {'periodos': {}, 'historico': None}

    for periodo in periodos:
        if periodo in PERIOD_DATA:
            periodo_data = PERIOD_DATA[periodo].copy()
            # Filtrar por perfiles
            filtered = {'title': periodo_data['title'], 'date': periodo_data['date']}
            for perfil in perfiles:
                if perfil in periodo_data:
                    filtered[perfil] = periodo_data[perfil]
                elif perfil == 'total' and 'total' in periodo_data:
                    filtered['total'] = periodo_data['total']
            data['periodos'][periodo] = filtered

    # Incluir datos históricos si se selecciona patrimonio
    if 'patrimonio' in secciones:
        data['historico'] = HISTORICAL_DATA

    return data

def export_to_excel(data, periodos, perfiles):
    """Exporta a Excel"""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = Workbook()
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1a2744", end_color="1a2744", fill_type="solid")
    thin_border = Border(left=Side(style='thin'), right=Side(style='thin'),
                         top=Side(style='thin'), bottom=Side(style='thin'))

    first_sheet = True
    for periodo_key, periodo_data in data['periodos'].items():
        if first_sheet:
            ws = wb.active
            ws.title = periodo_data.get('title', periodo_key)[:31]
            first_sheet = False
        else:
            ws = wb.create_sheet(periodo_data.get('title', periodo_key)[:31])

        # Título
        ws['A1'] = f"BLANES CAPITAL - {periodo_data.get('title', '')}"
        ws['A1'].font = Font(bold=True, size=14)
        ws.merge_cells('A1:D1')
        ws['A2'] = f"Fecha: {periodo_data.get('date', '')}"

        # Encabezados dinámicos según perfiles seleccionados
        headers = ['Concepto']
        for perfil in perfiles:
            if perfil == 'pablo':
                headers.append('Pablo')
            elif perfil == 'ale':
                headers.append('Alejandro')
            elif perfil == 'total':
                headers.append('Total')

        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = thin_border

        # Datos
        conceptos = [
            ('Patrimonio Total (M€)', 'patrimonioTotal'),
            ('Bajo Gestión (M€)', 'bajoGestion'),
            ('Empresarial (M€)', 'empresarial'),
            ('Rentabilidad (%)', 'rentabilidad'),
            ('Rentas Inmobiliarias (K€)', 'rentasInmob'),
            ('Cartera Financiera (M€)', 'carteraFinanciera'),
            ('Cartera Inmobiliaria (M€)', 'carteraInmobiliaria'),
            ('Inversiones Alternativas (M€)', 'alternativas'),
        ]

        row = 5
        for concepto_nombre, concepto_key in conceptos:
            ws.cell(row=row, column=1, value=concepto_nombre).border = thin_border
            col = 2
            for perfil in perfiles:
                if perfil in periodo_data and concepto_key in periodo_data[perfil]:
                    value = periodo_data[perfil][concepto_key]
                else:
                    value = '-'
                cell = ws.cell(row=row, column=col, value=value)
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="right")
                col += 1
            row += 1

        ws.column_dimensions['A'].width = 30
        for c in ['B', 'C', 'D', 'E']:
            ws.column_dimensions[c].width = 15

    # Hoja de datos históricos
    if data.get('historico'):
        ws_hist = wb.create_sheet("Evolución Histórica")
        ws_hist['A1'] = "BLANES CAPITAL - Evolución Patrimonial"
        ws_hist['A1'].font = Font(bold=True, size=14)

        hist_headers = ['Perfil / Concepto'] + data['historico']['years']
        for col, header in enumerate(hist_headers, 1):
            cell = ws_hist.cell(row=3, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = thin_border

        row = 4
        for perfil in ['pablo', 'ale']:
            if perfil in data['historico']:
                for metric in ['bajoGestion', 'empresarial']:
                    nombre = f"{'Pablo' if perfil == 'pablo' else 'Alejandro'} - {'Bajo Gestión' if metric == 'bajoGestion' else 'Empresarial'} (M€)"
                    ws_hist.cell(row=row, column=1, value=nombre).border = thin_border
                    for col, val in enumerate(data['historico'][perfil][metric], 2):
                        cell = ws_hist.cell(row=row, column=col, value=val)
                        cell.border = thin_border
                    row += 1

        ws_hist.column_dimensions['A'].width = 30

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f"BlanesCapital_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     as_attachment=True, download_name=filename)

def export_to_csv(data, periodos, perfiles):
    """Exporta a CSV"""
    import csv

    output = BytesIO()
    writer = csv.writer(output.getvalue().decode('utf-8').encode('utf-8-sig').split())

    lines = []
    lines.append("BLANES CAPITAL - Exportación de Datos")
    lines.append(f"Fecha de exportación: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    lines.append("")

    for periodo_key, periodo_data in data['periodos'].items():
        lines.append(f"=== {periodo_data.get('title', periodo_key)} ===")
        lines.append(f"Fecha datos: {periodo_data.get('date', '')}")
        lines.append("")

        # Headers
        header_line = "Concepto"
        for perfil in perfiles:
            if perfil == 'pablo':
                header_line += ",Pablo"
            elif perfil == 'ale':
                header_line += ",Alejandro"
            elif perfil == 'total':
                header_line += ",Total"
        lines.append(header_line)

        conceptos = [
            ('Patrimonio Total (M€)', 'patrimonioTotal'),
            ('Bajo Gestión (M€)', 'bajoGestion'),
            ('Empresarial (M€)', 'empresarial'),
            ('Rentabilidad (%)', 'rentabilidad'),
            ('Rentas Inmobiliarias (K€)', 'rentasInmob'),
            ('Cartera Financiera (M€)', 'carteraFinanciera'),
            ('Cartera Inmobiliaria (M€)', 'carteraInmobiliaria'),
            ('Inversiones Alternativas (M€)', 'alternativas'),
        ]

        for concepto_nombre, concepto_key in conceptos:
            line = concepto_nombre
            for perfil in perfiles:
                if perfil in periodo_data and concepto_key in periodo_data[perfil]:
                    line += f",{periodo_data[perfil][concepto_key]}"
                else:
                    line += ",-"
            lines.append(line)
        lines.append("")

    csv_content = "\n".join(lines)
    output = BytesIO(csv_content.encode('utf-8-sig'))

    filename = f"BlanesCapital_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return send_file(output, mimetype='text/csv', as_attachment=True, download_name=filename)

def export_to_pdf(data, periodos, perfiles):
    """Exporta a PDF - COMPLETO con toda la información"""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak

        output = BytesIO()
        doc = SimpleDocTemplate(output, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                               leftMargin=1.5*cm, rightMargin=1.5*cm)
        elements = []
        styles = getSampleStyleSheet()

        # Estilos personalizados
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24,
                                     textColor=colors.HexColor('#1a2744'), spaceAfter=10, alignment=1)
        subtitle_style = ParagraphStyle('CustomSubtitle', parent=styles['Normal'], fontSize=12,
                                        textColor=colors.HexColor('#666666'), spaceAfter=20, alignment=1)
        section_style = ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontSize=14,
                                       textColor=colors.HexColor('#1a2744'), spaceBefore=15, spaceAfter=10,
                                       borderColor=colors.HexColor('#1a2744'), borderWidth=1, borderPadding=5)
        subsection_style = ParagraphStyle('SubSection', parent=styles['Heading3'], fontSize=11,
                                          textColor=colors.HexColor('#2c4a7c'), spaceBefore=10, spaceAfter=5)

        # Colores para tablas
        header_color = colors.HexColor('#1a2744')
        alt_row_color = colors.HexColor('#f5f6fa')
        pablo_color = colors.HexColor('#e8f4fd')
        ale_color = colors.HexColor('#e8f8e8')

        def create_table(data_rows, col_widths=None):
            """Crea una tabla con estilo corporativo"""
            if col_widths is None:
                col_widths = [5*cm] + [3*cm] * (len(data_rows[0]) - 1)
            table = Table(data_rows, colWidths=col_widths)
            style = [
                ('BACKGROUND', (0, 0), (-1, 0), header_color),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, alt_row_color]),
            ]
            table.setStyle(TableStyle(style))
            return table

        # ==========================================
        # PORTADA
        # ==========================================
        elements.append(Spacer(1, 3*cm))
        elements.append(Paragraph("BLANES CAPITAL", title_style))
        elements.append(Paragraph("Informe de Gestión Patrimonial", subtitle_style))
        elements.append(Spacer(1, 1*cm))
        elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d de %B de %Y')}", subtitle_style))
        elements.append(PageBreak())

        # ==========================================
        # PROCESAR CADA PERIODO
        # ==========================================
        for periodo_key, periodo_info in data['periodos'].items():
            periodo_data = PERIOD_DATA.get(periodo_key, {})

            # TÍTULO DEL PERIODO
            elements.append(Paragraph(f"📊 {periodo_info.get('title', periodo_key)}", title_style))
            elements.append(Paragraph(f"Datos a {periodo_info.get('date', '')}", subtitle_style))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 1. RESUMEN EJECUTIVO
            # ==========================================
            elements.append(Paragraph("1. RESUMEN EJECUTIVO", section_style))

            # KPIs principales
            kpi_data = [['Indicador', 'Pablo', 'Alejandro', 'Total/Combinado']]

            pablo = periodo_data.get('pablo', {})
            ale = periodo_data.get('ale', {})
            total = periodo_data.get('total', {})

            kpis = [
                ('Patrimonio Total', f"{pablo.get('patrimonioTotal', '-')} M€", f"{ale.get('patrimonioTotal', '-')} M€",
                 f"{pablo.get('patrimonioTotal', 0) + ale.get('patrimonioTotal', 0):.1f} M€"),
                ('Patrimonio Bajo Gestión', f"{pablo.get('bajoGestion', '-')} M€", f"{ale.get('bajoGestion', '-')} M€",
                 f"{total.get('bajoGestion', '-')} M€"),
                ('Patrimonio Empresarial', f"{pablo.get('empresarial', '-')} M€", f"{ale.get('empresarial', '-')} M€",
                 f"{pablo.get('empresarial', 0) + ale.get('empresarial', 0):.1f} M€"),
                ('Rentabilidad', f"{pablo.get('rentabilidad', '-')}%", f"{ale.get('rentabilidad', '-')}%",
                 f"{total.get('rentabilidad', '-')}%"),
                ('Rentas Inmobiliarias', f"{pablo.get('rentasInmob', '-')} K€", f"{ale.get('rentasInmob', '-')} K€",
                 f"{total.get('rentasInmob', '-')} K€"),
            ]
            for kpi in kpis:
                kpi_data.append(list(kpi))

            elements.append(create_table(kpi_data, [5*cm, 3.5*cm, 3.5*cm, 4*cm]))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 2. COMPOSICIÓN DEL PATRIMONIO
            # ==========================================
            elements.append(Paragraph("2. COMPOSICIÓN DEL PATRIMONIO", section_style))

            comp_data = [['Tipo de Activo', 'Pablo', 'Alejandro', 'Total']]
            activos = [
                ('Cartera Financiera', pablo.get('carteraFinanciera', 0), ale.get('carteraFinanciera', 0)),
                ('Cartera Inmobiliaria', pablo.get('carteraInmobiliaria', 0), ale.get('carteraInmobiliaria', 0)),
                ('Inversiones Alternativas', pablo.get('alternativas', 0), ale.get('alternativas', 0)),
                ('Rotación/Liquidez', pablo.get('rotacion', 0), ale.get('rotacion', 0)),
            ]
            for activo, p_val, a_val in activos:
                comp_data.append([activo, f"{p_val} M€", f"{a_val} M€", f"{p_val + a_val:.1f} M€"])

            elements.append(create_table(comp_data, [5*cm, 3.5*cm, 3.5*cm, 4*cm]))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 3. CARTERA FINANCIERA
            # ==========================================
            elements.append(Paragraph("3. CARTERA FINANCIERA", section_style))

            # Composición por tipo de activo
            elements.append(Paragraph("3.1 Composición por Tipo de Activo", subsection_style))
            fin_data = [['Tipo', 'Pablo', 'Alejandro']]
            fin_data.append(['Renta Fija', f"{pablo.get('rf', '-')}%", f"{ale.get('rf', '-')}%"])
            fin_data.append(['Renta Variable', f"{pablo.get('rv', '-')}%", f"{ale.get('rv', '-')}%"])
            fin_data.append(['Mercado Monetario', f"{pablo.get('mp', '-')}%", f"{ale.get('mp', '-')}%"])
            elements.append(create_table(fin_data, [5*cm, 4*cm, 4*cm]))
            elements.append(Spacer(1, 0.3*cm))

            # Distribución por bancos
            elements.append(Paragraph("3.2 Distribución por Entidades", subsection_style))
            pablo_bancos = pablo.get('bancos', {})
            ale_bancos = ale.get('bancos', {})
            bancos_data = [['Entidad', 'Pablo', 'Alejandro']]
            bancos_data.append(['JP Morgan', f"{pablo_bancos.get('jp', '-')}%", f"{ale_bancos.get('jp', '-')}%"])
            bancos_data.append(['Goldman Sachs', f"{pablo_bancos.get('gs', '-')}%", f"{ale_bancos.get('gs', '-')}%"])
            bancos_data.append(['Banca March', f"{pablo_bancos.get('march', '-')}%", f"{ale_bancos.get('march', '-')}%"])
            bancos_data.append(['Andbank', f"{pablo_bancos.get('andbank', '-')}%", f"{ale_bancos.get('andbank', '-')}%"])
            elements.append(create_table(bancos_data, [5*cm, 4*cm, 4*cm]))
            elements.append(Spacer(1, 0.3*cm))

            # Exposición USD
            elements.append(Paragraph("3.3 Exposición a Divisas", subsection_style))
            usd_data = [['Divisa', 'Pablo', 'Alejandro']]
            usd_data.append(['Exposición USD', f"{pablo.get('exposicionUSD', '-')}%", f"{ale.get('exposicionUSD', '-')}%"])
            elements.append(create_table(usd_data, [5*cm, 4*cm, 4*cm]))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 4. CARTERA INMOBILIARIA
            # ==========================================
            elements.append(Paragraph("4. CARTERA INMOBILIARIA", section_style))

            inmob_data = [['Concepto', 'Pablo', 'Alejandro', 'Total']]
            inmob_data.append(['Valor Cartera', f"{pablo.get('carteraInmobiliaria', '-')} M€",
                              f"{ale.get('carteraInmobiliaria', '-')} M€",
                              f"{pablo.get('carteraInmobiliaria', 0) + ale.get('carteraInmobiliaria', 0):.1f} M€"])
            inmob_data.append(['Rentas Anuales', f"{pablo.get('rentasInmob', '-')} K€",
                              f"{ale.get('rentasInmob', '-')} K€",
                              f"{pablo.get('rentasInmob', 0) + ale.get('rentasInmob', 0)} K€"])
            if 'ocupacion' in pablo:
                inmob_data.append(['Ocupación', f"{pablo.get('ocupacion', '-')}%", f"{ale.get('ocupacion', '-')}%", '-'])

            elements.append(create_table(inmob_data, [5*cm, 3.5*cm, 3.5*cm, 4*cm]))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 5. INVERSIONES ALTERNATIVAS
            # ==========================================
            elements.append(Paragraph("5. INVERSIONES ALTERNATIVAS", section_style))

            alt_data = [['Concepto', 'Pablo', 'Alejandro', 'Total']]
            alt_data.append(['Valor Total', f"{pablo.get('alternativas', '-')} M€",
                            f"{ale.get('alternativas', '-')} M€",
                            f"{pablo.get('alternativas', 0) + ale.get('alternativas', 0):.1f} M€"])
            elements.append(create_table(alt_data, [5*cm, 3.5*cm, 3.5*cm, 4*cm]))
            elements.append(Spacer(1, 0.5*cm))

            # ==========================================
            # 6. ESTRUCTURA DE COSTES
            # ==========================================
            estructura = periodo_data.get('estructura', {})
            if estructura:
                elements.append(Paragraph("6. ESTRUCTURA DE COSTES", section_style))

                coste_data = [['Concepto', 'Valor']]
                coste_data.append(['Coste Total Anual', f"{estructura.get('total', '-'):,}€".replace(',', '.')])
                coste_data.append(['Ratio sobre Patrimonio', f"{estructura.get('ratio', '-')}%"])
                coste_data.append(['Presupuesto', f"{estructura.get('budget', '-'):,}€".replace(',', '.')])

                elements.append(create_table(coste_data, [6*cm, 6*cm]))
                elements.append(Spacer(1, 0.3*cm))

                # Desglose mensual si existe
                mensual = estructura.get('mensual', {})
                if mensual:
                    elements.append(Paragraph("6.1 Desglose Mensual (K€)", subsection_style))
                    meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                    meses_keys = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
                    mensual_data = [meses[:len(mensual)]]
                    valores = [f"{mensual.get(k, '-')}" for k in meses_keys[:len(mensual)]]
                    mensual_data.append(valores)
                    elements.append(create_table(mensual_data, [1.5*cm] * len(mensual)))

            elements.append(PageBreak())

        # ==========================================
        # EVOLUCIÓN HISTÓRICA
        # ==========================================
        if data.get('historico'):
            elements.append(Paragraph("📈 EVOLUCIÓN HISTÓRICA", title_style))
            elements.append(Spacer(1, 0.5*cm))

            hist = data['historico']
            years = hist.get('years', [])

            # Patrimonio Bajo Gestión
            elements.append(Paragraph("Patrimonio Bajo Gestión (M€)", section_style))
            hist_gestion = [['Perfil'] + years]
            hist_gestion.append(['Pablo'] + [str(v) for v in hist.get('pablo', {}).get('bajoGestion', [])])
            hist_gestion.append(['Alejandro'] + [str(v) for v in hist.get('ale', {}).get('bajoGestion', [])])
            elements.append(create_table(hist_gestion, [3*cm] + [2*cm] * len(years)))
            elements.append(Spacer(1, 0.5*cm))

            # Patrimonio Empresarial
            elements.append(Paragraph("Patrimonio Empresarial (M€)", section_style))
            hist_emp = [['Perfil'] + years]
            hist_emp.append(['Pablo'] + [str(v) for v in hist.get('pablo', {}).get('empresarial', [])])
            hist_emp.append(['Alejandro'] + [str(v) for v in hist.get('ale', {}).get('empresarial', [])])
            elements.append(create_table(hist_emp, [3*cm] + [2*cm] * len(years)))

        # Pie de página
        elements.append(Spacer(1, 1*cm))
        elements.append(Paragraph("_" * 80, styles['Normal']))
        elements.append(Paragraph("Documento generado automáticamente por Blanes Capital Dashboard", subtitle_style))
        elements.append(Paragraph("Este documento es confidencial y está destinado únicamente al uso interno.", subtitle_style))

        doc.build(elements)
        output.seek(0)

        filename = f"BlanesCapital_Informe_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return send_file(output, mimetype='application/pdf', as_attachment=True, download_name=filename)

    except ImportError:
        return {'error': 'Librería reportlab no instalada'}, 500
    except Exception as e:
        return {'error': str(e)}, 500

# ============================================
# INICIALIZACIÓN
# ============================================
def create_tables():
    """Crea las tablas y el usuario por defecto"""
    with app.app_context():
        db.create_all()

        # Crear usuario admin si no existe
        if not User.query.filter_by(username='blanes').first():
            admin = User(username='blanes', email='admin@blanescapital.com', is_admin=True)
            admin.set_password('blanes2025')
            db.session.add(admin)
            db.session.commit()
            print('Usuario admin creado: blanes / blanes2025')

# Crear tablas al iniciar
create_tables()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
