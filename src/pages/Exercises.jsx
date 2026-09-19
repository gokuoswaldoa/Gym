import { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';

export default function Exercises() {
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray());
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleEdit = (ex) => {
    setEditingId(ex.id);
    setEditName(ex.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (oldEx) => {
    if (!editName.trim()) return cancelEdit();
    if (editName.trim() === oldEx.name) return cancelEdit();

    // Comprobar si ya existe uno con ese nombre exacto (case-insensitive)
    const existing = await db.exercises
      .filter(ex => ex.name.toLowerCase() === editName.trim().toLowerCase())
      .first();

    if (existing && existing.id !== oldEx.id) {
      const confirmMerge = window.confirm(
        `Ya existe un ejercicio llamado "${existing.name}". ¿Quieres FUSIONAR este ejercicio con el existente? Esto unirá todo tu historial en uno solo y no se puede deshacer.`
      );
      
      if (confirmMerge) {
        // Fusionar
        await db.transaction('rw', db.exercises, db.sets, async () => {
          // Cambiar todos los sets del ejercicio viejo al existente
          await db.sets.where({ exerciseId: oldEx.id }).modify({ exerciseId: existing.id });
          // Eliminar el ejercicio viejo
          await db.exercises.delete(oldEx.id);
        });
        import('../lib/sync').then(({ triggerSync }) => triggerSync());
      }
    } else {
      // Simplemente renombrar
      await db.exercises.update(oldEx.id, { name: editName.trim() });
      import('../lib/sync').then(({ triggerSync }) => triggerSync());
    }
    
    cancelEdit();
  };

  const handleDelete = async (id, name) => {
    const setsCount = await db.sets.where({ exerciseId: id }).count();
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar "${name}"? Se borrarán ${setsCount} series registradas de tu historial. Esta acción NO se puede deshacer.`
    );

    if (confirmDelete) {
      await db.transaction('rw', db.exercises, db.sets, async () => {
        await db.sets.where({ exerciseId: id }).delete();
        await db.exercises.delete(id);
      });
      import('../lib/sync').then(({ triggerSync }) => triggerSync());
    }
  };

  if (!exercises) return <div className="p-4">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bebas text-spidey-red tracking-wide">Tus Ejercicios</h2>
      </div>

      <div className="bg-[#111112] p-5 rounded-2xl shadow-sm border border-spidey-gray/30 space-y-4">
        <p className="text-sm font-work text-spidey-gray">
          Administra tu base de datos de ejercicios. Si reescribes el nombre para que coincida con otro ejercicio existente, se fusionarán y tu historial se conectará automáticamente.
        </p>

        <div className="space-y-2 mt-4">
          {exercises.map(ex => (
            <div key={ex.id} className="flex items-center justify-between bg-spidey-gray/5 border border-spidey-gray/20 p-3 rounded-xl">
              {editingId === ex.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-spidey-black border border-spidey-blue rounded-lg p-2 text-spidey-white focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(ex)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg">
                    <Check size={20} />
                  </button>
                  <button onClick={cancelEdit} className="p-2 text-spidey-gray hover:bg-spidey-gray/10 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="font-work text-spidey-white">{ex.name}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(ex)} className="p-2 text-spidey-blue hover:bg-spidey-blue/10 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(ex.id, ex.name)} className="p-2 text-spidey-red hover:bg-spidey-red/10 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
