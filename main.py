"""
Blanes Capital Dashboard - Flask Application
Para ejecutar en PythonAnywhere
"""

from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os

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
# API ENDPOINTS (para futuras funcionalidades)
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
