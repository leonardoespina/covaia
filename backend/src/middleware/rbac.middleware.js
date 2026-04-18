const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ message: 'Autenticación requerida para verificar permisos' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: `Acceso denegado (Requiere rol: ${roles.join(',')})` });
    }

    next();
  };
};

module.exports = { requireRole };
