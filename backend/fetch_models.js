import fs from 'fs';
async function list() {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB9xt5lmO1K5ZyPZiRReZIuAUl2Vel0GrI");
  const d = await r.json();
  fs.writeFileSync('models.json', JSON.stringify(d, null, 2));
}
list();
