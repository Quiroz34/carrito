from flask import Flask, render_template
import os

# Specify the template and static folders
app = Flask(__name__, 
            template_folder='app/templates',
            static_folder='app/static')

@app.route('/')
def index():
    """Serve the main HTML file"""
    return render_template('index.html')

if __name__ == '__main__':
    print(f'Listening on http://localhost:3000 ...')
    app.run(host='localhost', port=3000, debug=True)
