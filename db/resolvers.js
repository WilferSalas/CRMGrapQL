const Cliente = require('../models/Clientes');
const Pedido = require('../models/Pedidos');
const Producto = require('../models/Productos');
const Usuario = require('../models/Usuarios');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Error } = require('mongoose');
require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
    const { id, email, nombre, apellido } = usuario;

    return jwt.sign({ id, email, nombre, apellido }, secreta, { expiresIn });
};

// Resolvers
const resolvers = {
    Query: {
        obtenerUsuario: async (_, {}, ctx) => {
            return ctx.usuario;
        },
        obtenerProductos: async () => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(`Error al obtener los productos: ${error}`)
            }
        },
        obtenerProducto: async (_, { id }) => {
            // Revisar que el producto existe
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error('El producto no existe');
            }

            return producto;
        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({});

                return clientes;
            } catch (error) {
                console.log(`Error al obtener los clientes: ${error}`)
            }
        },
        obtenerClientesVendedor: async (_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({
                    vendedor: ctx.usuario.id.toString()
                });

                return clientes;
            } catch (error) {
                console.log(`Error al obtener los clientes del vendedor: ${error}`)
            }
        },
        obtenerCliente: async (_, { id }, ctx) => {
            // Verificar  que existe el cliente
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }

            // Solo quien lo creo, puede verlo
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este cliente');
            }

            return cliente;
        },
        obtenerPedidos: async () => {
            try {
                const pedidos = await Pedido.find({});

                return pedidos;
            } catch (error) {
                console.log(`Error al traer los pedidos: ${error}`)
            }
        },
        obtenerPedidosVendedor: async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido
                    .find({ vendedor: ctx.usuario.id })
                        .populate('cliente');

                return pedidos
            } catch (error) {
                console.log(`Error al traer los pedidos: ${error}`)
            }
        },
        obtenerPedido: async (_, { id }, ctx) => {
            // Verificar  que existe el producti
            pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }

            // Solo quien lo creo, puede verlo
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este pedido');
            }

            return pedido;
        },
        obtenerPedidosEstado: async (_, { estado }, ctx) => {
            // Verificar que existe el pedido
            const pedidos = await Pedido.find({
                vendedor: ctx.usuario.id,
                estado
            });

            return pedidos;
        },
        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                {
                    $match: {
                        estado: "Completado"
                    }
                },
                {
                    $group: {
                        _id: "$cliente",
                        total: {
                            $sum: '$total'
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort: {
                        total: -1
                    }
                }
            ]);

            return clientes;
        },
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                {
                    $match: {
                        estado: "Completado"
                    }
                },
                {
                    $group: {
                        _id: "$vendedor",
                        total: {
                            $sum: '$total'
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: "_id",
                        as: "vendedor"
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: {
                        total: -1
                    }
                }
            ]);

            return vendedores;
        },
        buscarProducto: async (_, { texto }) => {
            const producto = await Producto.find({
                $text: {
                    $search: texto
                }
            }).limit(10);

            return producto;
        }
    },
    Mutation: {
        nuevoUsuario: async (_, { input }) => {
            const { email, password } = input;

            // Revisar si el usuario existe
            const existeUsuario = await Usuario.findOne({ email });
            if (existeUsuario) {
                throw new Error('El usuario ya esta registrado');
            }

            // Hashear el password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);

            // Guardarlo en la base de datos
            try {
                const usuario = new Usuario(input);
                usuario.save(); // Guardar usurio en la BD
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async (_, { input }) => {
            const { email, password } = input;

            // Revisar si el usuario existe
            const usuarioExiste = await Usuario.findOne({ email });
            if (!usuarioExiste) {
                throw new Error('El usuario no existe');
            }

            // Revisar que el password es valido
            const passwordEsCorrecto = await bcryptjs.compare(password, usuarioExiste.password);
            if (!passwordEsCorrecto) {
                throw new Error('La contraseña es incorrecta');
            }

            // Crear el token
            return {
                token: crearToken(usuarioExiste, process.env.SECRETA, '72h')
            }
        },
        nuevoProducto: async (_, { input }) => {
            try {
                const producto = new Producto(input);
                const resultado = await producto.save(); // Guardar producto en la BD
                return resultado;
            } catch (error) {
                console.log(`Error al crear el producto: ${error}`);
            }
        },
        actualizarProducto: async (_, { id, input }) => {
            let producto = await Producto.findById(id);
            if (!producto) {
                throw new Error ('El producto no existe');
            }

            producto = await Producto.findByIdAndUpdate({ _id: id }, input, { new: true });
            return producto;
        },
        eliminarProducto: async (_, { id }) => {
            const producto = await Producto.findById(id);
            if (!producto) {
                throw new Error ('El producto no existe');
            }

            await Producto.findOneAndDelete({ _id: id }); // Eliminar producto
            return 'El producto se elimino'
        },
        nuevoCliente: async (_, { input }, ctx) => {
            const { email } = input;

            // Verificar si el cliente esta ya registrado
            const cliente = await Cliente.findOne({ email });
            if (cliente) {
                throw new Error ('El cliente ya se encuentra registrado');
            }

            let nuevoCliente = new Cliente(input);

            // Asignar un vendedor
            nuevoCliente.vendedor = ctx.usuario.id;

            // Guardarlo en la BD
            try {
                const resultado = await nuevoCliente.save();
                return resultado;
            } catch (error) {
                console.log(`Error guardando cliente: ${error}`)
            }
        },
        actualizarCliente: async (_, { id, input }, ctx) => {
            // Verificar  que existe el cliente
            let cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }

            // Solo el vendedor es quien puede editarlo
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este cliente');
            }

            cliente = await Cliente.findByIdAndUpdate({ _id: id }, input, { new: true });
            return cliente;
        },
        eliminarCliente: async (_, { id }, ctx) => {
            const cliente = await Cliente.findById(id);
            if (!cliente) {
                throw new Error('El cliente no existe');
            }

            // Solo el vendedor es quien puede eliminarlo
            if (cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este cliente');
            }

            // Eliminar cliente
            await Cliente.findOneAndDelete({ _id: id });
            return 'El cliente se elimino';
        },
        nuevoPedido: async (_, { input }, ctx) => {
            const { cliente } = input;

            // Verificar si el cliente existe
            const clienteExiste = await Cliente.findById(cliente);
            if (!clienteExiste) {
                throw new Error('El cliente no existe');
            }

            // Verificar si el cliente es del vendedor
            if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este cliente');
            }

            // Revisar si el stock esta disponible
            for await (const articulo of input.pedido) {
                const { id } = articulo;

                const producto = await Producto.findById(id);

                if (articulo.cantidad > producto.existencia) {
                    throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
                } else {
                    // Restar cantidad a lo disponible
                    producto.existencia = producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }

            // Crear un nuevo pedido
            let nuevoPedido = new Pedido(input);

            // Guardar pedido en la base de datos
            nuevoPedido.vendedor = ctx.usuario.id;

            // Asignar un vendedor al pedido
            const resultado = await nuevoPedido.save();
            return resultado;
        },
        actualizarPedido: async (_, { id, input }, ctx) => {
            const { cliente } = input;

            // Verificar que existe el pedido
            let pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }

            // Verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if (!existeCliente) {
                throw new Error('El cliente no existe');
            }

            // Verificar si el cliente y el vendedor pertenecen al usuario
            if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este pedido');
            }

            // Revisar el stock
            if (input.pedido) {
                for await (const articulo of input.pedido) {
                    const { id } = articulo;

                    const producto = await Producto.findById(id);

                    if (articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        // Restar cantidad a lo disponible
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
            }

            resultado = await Pedido.findByIdAndUpdate({ _id: id }, input, { new: true });
            return resultado;
        },
        eliminarPedido: async (_, { id }, ctx) => {
            // Verificar que existe el pedido
            let pedido = await Pedido.findById(id);
            if (!pedido) {
                throw new Error('El pedido no existe');
            }

            // Verificar si el cliente es del vendedor
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes permiso para acceder a este pedido');
            }

            // Eliminar de la BD
            await Pedido.findOneAndDelete({ _id: id });
            return 'El pedido se elimino';
        }
    }
}

module.exports = resolvers;