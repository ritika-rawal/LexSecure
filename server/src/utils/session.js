const runSessionOperation = (operation) =>
  new Promise((resolve, reject) => {
    operation((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

export const regenerateSession = (req) =>
  runSessionOperation((callback) => req.session.regenerate(callback));

export const saveSession = (req) =>
  runSessionOperation((callback) => req.session.save(callback));

export const destroySession = (req) =>
  runSessionOperation((callback) => req.session.destroy(callback));
