import { db } from '../db/db';
import { supabase } from '../db/supabase';

// Hardcoded UUID para uso personal simple (sin Auth real por ahora)
const USER_ID = '11111111-1111-1111-1111-111111111111';

export const triggerSync = async () => {
  if (!navigator.onLine) {
    console.log("Offline: no se puede sincronizar ahora.");
    return;
  }

  try {
    // 1. Obtener todos los datos locales
    const dataToSync = {
      workouts: await db.workouts.toArray(),
      exercises: await db.exercises.toArray(),
      sets: await db.sets.toArray(),
      bodyWeightLogs: await db.bodyWeightLogs.toArray(),
      plannedRoutines: await db.plannedRoutines.toArray(),
    };

    // 2. Subir a Supabase (Upsert para sobreescribir con la versión más reciente)
    const { error } = await supabase
      .from('backups')
      .upsert({ 
        id: USER_ID, 
        data: dataToSync,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error al sincronizar a la nube:", error);
    } else {
      console.log("Sincronización a la nube exitosa.");
      localStorage.setItem('lastSync', new Date().toISOString());
    }
  } catch (err) {
    console.error("Fallo inesperado al sincronizar:", err);
  }
};

export const downloadSync = async () => {
  if (!navigator.onLine) return;

  try {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .eq('id', USER_ID)
      .single();

    if (error || !data) return;

    const cloudDate = new Date(data.created_at);
    const localDateStr = localStorage.getItem('lastSync');
    
    // Si la nube tiene datos más recientes que nuestra última sincronización local
    if (!localDateStr || cloudDate > new Date(localDateStr)) {
      console.log("Descargando datos de la nube...");
      const cloudData = data.data;
      
      await db.transaction('rw', db.workouts, db.exercises, db.sets, db.bodyWeightLogs, db.plannedRoutines, async () => {
        if (cloudData.workouts) { await db.workouts.clear(); await db.workouts.bulkAdd(cloudData.workouts); }
        if (cloudData.exercises) { await db.exercises.clear(); await db.exercises.bulkAdd(cloudData.exercises); }
        if (cloudData.sets) { await db.sets.clear(); await db.sets.bulkAdd(cloudData.sets); }
        if (cloudData.bodyWeightLogs) { await db.bodyWeightLogs.clear(); await db.bodyWeightLogs.bulkAdd(cloudData.bodyWeightLogs); }
        if (cloudData.plannedRoutines) { await db.plannedRoutines.clear(); await db.plannedRoutines.bulkAdd(cloudData.plannedRoutines); }
      });
      
      localStorage.setItem('lastSync', new Date().toISOString());
      // Refrescar página para cargar nuevos datos (opcional, pero seguro)
      window.location.reload();
    }
  } catch (err) {
    console.error("Error al descargar sincronización:", err);
  }
};
