# Back-end CRM Clientes con GraphQL

_Back-end del CRM Clientes hecho con GraphQL, Apollo y Mongo DB_

## Comenzando 🚀

_Estas instrucciones te permitirán obtener una copia del proyecto en funcionamiento en tu máquina local para propósitos de desarrollo y pruebas._

Mira **Deployment** para conocer como desplegar el proyecto.


### Pre-requisitos 📋

_Que cosas necesitas para instalar el software y como instalarlas_

```
Node JS
```

### Instalación 🔧

_Una serie de ejemplos paso a paso que te dice lo que debes ejecutar para tener un entorno de desarrollo ejecutandose_

```
$ git clone https://github.com/WilferSalas/CRMGrapQL.git
```

```
$ npm install
```

```
$ npm run dev
```

_Ejemplo de consulta con GrapQL a los datos de mejores clientes_

```
query mejoresClientes {
  mejoresClientes {
    total
    cliente {
      nombre
      apellido
    }
  }
}
```

## Construido con 🛠️

_Menciona las herramientas que utilizaste para crear tu proyecto_

* [GraphQL](https://graphql.org/) - El lenguaje de manipulación y consulta
* [Apollo Cliente](https://www.apollographql.com/) - Biblioteca integral de administración de estado 
* [Mongo DB](https://www.mongodb.com/) - Base de datos NoSQL

## Autores ✒️

_Menciona a todos aquellos que ayudaron a levantar el proyecto desde sus inicios_

* **Wilfer Salas** - [WilferSalas](https://github.com/WilferSalas)

## Expresiones de Gratitud 🎁

* Comenta a otros sobre este proyecto 📢
* Invita una cerveza 🍺 o un café ☕ a alguien del equipo. 
* Da las gracias públicamente 🤓.
* etc.



---
⌨️ con ❤️ por [WilferSalas](https://github.com/WilferSalas) 😊
