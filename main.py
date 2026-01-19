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

@app.route('/api/export/excel')
@login_required
def export_excel():
    """Exporta los datos a un archivo Excel - REQUIERE LOGIN"""
    try:
        from openpyxl import Workbook
        from openpyxl.styles import Font, Fill, PatternFill, Alignment, Border, Side
        from openpyxl.utils import get_column_letter

        wb = Workbook()

        # Estilos
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1a2744", end_color="1a2744", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        # ===== HOJA 1: Resumen 1S 2025 =====
        ws1 = wb.active
        ws1.title = "Resumen 1S 2025"

        data_1s2025 = PERIOD_DATA['1s2025']

        # Título
        ws1['A1'] = "BLANES CAPITAL - Resumen 1er Semestre 2025"
        ws1['A1'].font = Font(bold=True, size=14)
        ws1.merge_cells('A1:E1')

        # Encabezados
        headers = ['Concepto', 'Pablo', 'Alejandro', 'Total']
        for col, header in enumerate(headers, 1):
            cell = ws1.cell(row=3, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # Datos
        rows_data = [
            ('Patrimonio Total (M€)', data_1s2025['pablo']['patrimonioTotal'], data_1s2025['ale']['patrimonioTotal'],
             data_1s2025['pablo']['patrimonioTotal'] + data_1s2025['ale']['patrimonioTotal']),
            ('Bajo Gestión (M€)', data_1s2025['pablo']['bajoGestion'], data_1s2025['ale']['bajoGestion'],
             data_1s2025['total']['bajoGestion']),
            ('Empresarial (M€)', data_1s2025['pablo']['empresarial'], data_1s2025['ale']['empresarial'],
             data_1s2025['pablo']['empresarial'] + data_1s2025['ale']['empresarial']),
            ('Rentabilidad (%)', data_1s2025['pablo']['rentabilidad'], data_1s2025['ale']['rentabilidad'],
             data_1s2025['total']['rentabilidad']),
            ('Rentas Inmobiliarias (K€)', data_1s2025['pablo']['rentasInmob'], data_1s2025['ale']['rentasInmob'],
             data_1s2025['total']['rentasInmob']),
            ('Cartera Financiera (M€)', data_1s2025['pablo']['carteraFinanciera'], data_1s2025['ale']['carteraFinanciera'],
             data_1s2025['pablo']['carteraFinanciera'] + data_1s2025['ale']['carteraFinanciera']),
            ('Cartera Inmobiliaria (M€)', data_1s2025['pablo']['carteraInmobiliaria'], data_1s2025['ale']['carteraInmobiliaria'],
             data_1s2025['pablo']['carteraInmobiliaria'] + data_1s2025['ale']['carteraInmobiliaria']),
            ('Inversiones Alternativas (M€)', data_1s2025['pablo']['alternativas'], data_1s2025['ale']['alternativas'],
             data_1s2025['pablo']['alternativas'] + data_1s2025['ale']['alternativas']),
            ('Exposición USD (%)', data_1s2025['pablo']['exposicionUSD'], data_1s2025['ale']['exposicionUSD'], '-'),
        ]

        for row_idx, row_data in enumerate(rows_data, 4):
            for col_idx, value in enumerate(row_data, 1):
                cell = ws1.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin_border
                if col_idx > 1:
                    cell.alignment = Alignment(horizontal="right")

        # Ajustar anchos de columna
        ws1.column_dimensions['A'].width = 30
        for col in ['B', 'C', 'D']:
            ws1.column_dimensions[col].width = 15

        # ===== HOJA 2: Resumen 2024 =====
        ws2 = wb.create_sheet("Resumen 2024")

        data_2024 = PERIOD_DATA['2024']

        ws2['A1'] = "BLANES CAPITAL - Resumen Cierre 2024"
        ws2['A1'].font = Font(bold=True, size=14)
        ws2.merge_cells('A1:E1')

        for col, header in enumerate(headers, 1):
            cell = ws2.cell(row=3, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        rows_data_2024 = [
            ('Patrimonio Total (M€)', data_2024['pablo']['patrimonioTotal'], data_2024['ale']['patrimonioTotal'],
             data_2024['pablo']['patrimonioTotal'] + data_2024['ale']['patrimonioTotal']),
            ('Bajo Gestión (M€)', data_2024['pablo']['bajoGestion'], data_2024['ale']['bajoGestion'],
             data_2024['total']['bajoGestion']),
            ('Empresarial (M€)', data_2024['pablo']['empresarial'], data_2024['ale']['empresarial'],
             data_2024['pablo']['empresarial'] + data_2024['ale']['empresarial']),
            ('Rentabilidad (%)', data_2024['pablo']['rentabilidad'], data_2024['ale']['rentabilidad'],
             data_2024['total']['rentabilidad']),
            ('Rentas Inmobiliarias (K€)', data_2024['pablo']['rentasInmob'], data_2024['ale']['rentasInmob'],
             data_2024['total']['rentasInmob']),
            ('Cartera Financiera (M€)', data_2024['pablo']['carteraFinanciera'], data_2024['ale']['carteraFinanciera'],
             data_2024['pablo']['carteraFinanciera'] + data_2024['ale']['carteraFinanciera']),
            ('Cartera Inmobiliaria (M€)', data_2024['pablo']['carteraInmobiliaria'], data_2024['ale']['carteraInmobiliaria'],
             data_2024['pablo']['carteraInmobiliaria'] + data_2024['ale']['carteraInmobiliaria']),
            ('Inversiones Alternativas (M€)', data_2024['pablo']['alternativas'], data_2024['ale']['alternativas'],
             data_2024['pablo']['alternativas'] + data_2024['ale']['alternativas']),
        ]

        for row_idx, row_data in enumerate(rows_data_2024, 4):
            for col_idx, value in enumerate(row_data, 1):
                cell = ws2.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin_border
                if col_idx > 1:
                    cell.alignment = Alignment(horizontal="right")

        ws2.column_dimensions['A'].width = 30
        for col in ['B', 'C', 'D']:
            ws2.column_dimensions[col].width = 15

        # ===== HOJA 3: Evolución Histórica =====
        ws3 = wb.create_sheet("Evolución Histórica")

        ws3['A1'] = "BLANES CAPITAL - Evolución Patrimonial"
        ws3['A1'].font = Font(bold=True, size=14)
        ws3.merge_cells('A1:G1')

        # Encabezados años
        hist_headers = ['Perfil / Concepto'] + HISTORICAL_DATA['years']
        for col, header in enumerate(hist_headers, 1):
            cell = ws3.cell(row=3, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = header_alignment
            cell.border = thin_border

        # Datos Pablo
        ws3.cell(row=4, column=1, value="Pablo - Bajo Gestión (M€)").border = thin_border
        for col, val in enumerate(HISTORICAL_DATA['pablo']['bajoGestion'], 2):
            cell = ws3.cell(row=4, column=col, value=val)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right")

        ws3.cell(row=5, column=1, value="Pablo - Empresarial (M€)").border = thin_border
        for col, val in enumerate(HISTORICAL_DATA['pablo']['empresarial'], 2):
            cell = ws3.cell(row=5, column=col, value=val)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right")

        # Datos Alejandro
        ws3.cell(row=6, column=1, value="Alejandro - Bajo Gestión (M€)").border = thin_border
        for col, val in enumerate(HISTORICAL_DATA['ale']['bajoGestion'], 2):
            cell = ws3.cell(row=6, column=col, value=val)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right")

        ws3.cell(row=7, column=1, value="Alejandro - Empresarial (M€)").border = thin_border
        for col, val in enumerate(HISTORICAL_DATA['ale']['empresarial'], 2):
            cell = ws3.cell(row=7, column=col, value=val)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right")

        ws3.column_dimensions['A'].width = 30
        for col in ['B', 'C', 'D', 'E', 'F', 'G']:
            ws3.column_dimensions[col].width = 12

        # Guardar en memoria
        output = BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"BlanesCapital_Datos_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"

        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )

    except ImportError:
        return {'error': 'Librería openpyxl no instalada'}, 500
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
