export type Language = 'en' | 'es'

export interface Translations {
  // Navigation
  nav: {
    home: string
    forums: string
    trends: string
    new: string
  }
  
  // Auth
  auth: {
    login: string
    register: string
    logout: string
    profile: string
    signIn: string
    signUp: string
    email: string
    password: string
    username: string
    confirmPassword: string
    noAccount: string
    haveAccount: string
    registerHere: string
    loginHere: string
    loggingIn: string
    registering: string
  }
  
  // Post
  post: {
    create: string
    publish: string
    publishing: string
    title: string
    content: string
    selectCommunity: string
    whatAreYouThinking: string
    writePost: string
    noMorePosts: string
    comments: string
    comment: string
    commenting: string
    writeComment: string
    loginToComment: string
    share: string
    save: string
    back: string
    postedBy: string
    ago: string
    hot: string
    new: string
    top: string
    all: string
    trends: string
    newPosts: string
    popularPosts: string
    following: string
    forYou: string
    edit: string
    delete: string
    editing: string
    deleting: string
    edited: string
    editedOn: string
    confirmDelete: string
    confirmDeletePost: string
    confirmDeleteComment: string
    cancel: string
  }
  
  // Community
  community: {
    communities: string
    createCommunity: string
    join: string
    leave: string
    joined: string
    members: string
    posts: string
    postsToday: string
    createdBy: string
    description: string
    name: string
    uniqueName: string
    public: string
    private: string
    requiresApproval: string
    joinRequest: string
    approve: string
    reject: string
    requests: string
    noRequests: string
    requestedJoin: string
    noCommunities: string
    createFirst: string
    searchCommunities: string
    notFound: string
    backToHome: string
    privateDescription: string
  }
  
  // Sidebar
  sidebar: {
    quickNav: string
    stats: string
  }
  
  // User
  user: {
    profile: string
    karma: string
    memberSince: string
    publications: string
    notFound: string
    followers: string
    following: string
    follow: string
    unfollow: string
    editProfile: string
    bio: string
    website: string
    location: string
    socialLinks: string
    projects: string
    addProject: string
    addSocialLink: string
    save: string
    cancel: string
    interests: string
    selectInterests: string
    interestsDescription: string
  }
  
  // Common
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    close: string
    confirm: string
    yes: string
    no: string
    characters: string
    minutes: string
    hours: string
    days: string
    seconds: string
  }
  
  // Rich Text Editor
  editor: {
    bold: string
    italic: string
    underline: string
    code: string
    quote: string
    list: string
    orderedList: string
    link: string
    imageUrl: string
    videoUrl: string
    enterUrl: string
    enterLinkText: string
    enterImageUrl: string
    enterVideoUrl: string
    writeHere: string
    tipMarkdown: string
  }
  
  // Mobile
  mobile: {
    create: string
  }
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      forums: 'Forums',
      trends: 'Trends',
      new: 'New',
    },
    auth: {
      login: 'Log In',
      register: 'Register',
      logout: 'Log Out',
      profile: 'Profile',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      confirmPassword: 'Confirm Password',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      registerHere: 'Register here',
      loginHere: 'Log in here',
      loggingIn: 'Logging in...',
      registering: 'Registering...',
    },
    post: {
      create: 'Create Post',
      publish: 'Publish',
      publishing: 'Publishing...',
      title: 'Title',
      content: 'Content',
      selectCommunity: 'Select Community',
      whatAreYouThinking: "What's on your mind?",
      writePost: 'Write your post here...',
      noMorePosts: '😢 No more posts',
      comments: 'Comments',
      comment: 'Comment',
      commenting: 'Commenting...',
      writeComment: 'Write a comment...',
      loginToComment: 'Log in to comment',
      share: 'Share',
      save: 'Save',
      back: 'Back',
      postedBy: 'Posted by',
      ago: 'ago',
      hot: 'Hot',
      new: 'New',
      top: 'Top',
      all: 'All',
      trends: 'Trends',
      newPosts: 'New posts',
      popularPosts: 'Popular and most commented posts',
      following: 'Following',
      forYou: 'For You',
      edit: 'Edit',
      delete: 'Delete',
      editing: 'Editing...',
      deleting: 'Deleting...',
      edited: 'Edited',
      editedOn: 'Edited on',
      confirmDelete: 'Are you sure?',
      confirmDeletePost: 'Are you sure you want to delete this post? This action cannot be undone.',
      confirmDeleteComment: 'Are you sure you want to delete this comment? This action cannot be undone.',
      cancel: 'Cancel',
    },
    community: {
      communities: 'Communities',
      createCommunity: 'Create Community',
      join: 'Join',
      leave: 'Leave',
      joined: 'Joined',
      members: 'Members',
      posts: 'Posts',
      postsToday: 'Posts Today',
      createdBy: 'Created by',
      description: 'Description',
      name: 'Name',
      uniqueName: 'Name must be unique and can only contain letters, numbers, and hyphens',
      public: 'Public',
      private: 'Private',
      requiresApproval: 'Requires Approval',
      joinRequest: 'Join Request',
      approve: 'Approve',
      reject: 'Reject',
      requests: 'Requests',
      noRequests: 'No pending requests',
      requestedJoin: 'Requested to join',
      noCommunities: 'No communities yet',
      createFirst: 'Create the first one',
      searchCommunities: 'Search communities...',
      notFound: 'Community not found',
      backToHome: 'Back to home',
      privateDescription: 'Private community: Users will need approval to join',
    },
    sidebar: {
      quickNav: 'Quick Navigation',
      stats: 'Discourse',
    },
    user: {
      profile: 'Profile',
      karma: 'Karma',
      memberSince: 'Member since',
      publications: 'publications',
      notFound: 'User not found',
      followers: 'Followers',
      following: 'Following',
      follow: 'Follow',
      unfollow: 'Unfollow',
      editProfile: 'Edit Profile',
      bio: 'Bio',
      website: 'Website',
      location: 'Location',
      socialLinks: 'Social Links',
      projects: 'Projects',
      addProject: 'Add Project',
      addSocialLink: 'Add Social Link',
      save: 'Save',
      cancel: 'Cancel',
      interests: 'Interests',
      selectInterests: 'Select your interests',
      interestsDescription: 'Select topics you\'re interested in to personalize your feed',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      characters: 'characters',
      minutes: 'minutes',
      hours: 'hours',
      days: 'days',
      seconds: 'seconds ago',
    },
    editor: {
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      code: 'Code',
      quote: 'Quote',
      list: 'List',
      orderedList: 'Numbered List',
      link: 'Link',
      imageUrl: 'Image (URL)',
      videoUrl: 'Video (URL)',
      enterUrl: 'Enter URL:',
      enterLinkText: 'Enter link text:',
      enterImageUrl: 'Enter image URL:',
      enterVideoUrl: 'Enter video URL:',
      writeHere: 'Write your publication here...',
      tipMarkdown: '💡 Tip: Use Markdown for formatting. Example: **bold**, *italic*, [link](url)',
    },
    mobile: {
      create: 'Create',
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      forums: 'Foros',
      trends: 'Tendencias',
      new: 'Nuevo',
    },
    auth: {
      login: 'Iniciar Sesión',
      register: 'Registrarse',
      logout: 'Cerrar Sesión',
      profile: 'Perfil',
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      email: 'Correo',
      password: 'Contraseña',
      username: 'Usuario',
      confirmPassword: 'Confirmar Contraseña',
      noAccount: '¿No tienes cuenta?',
      haveAccount: '¿Ya tienes cuenta?',
      registerHere: 'Regístrate aquí',
      loginHere: 'Inicia sesión aquí',
      loggingIn: 'Iniciando sesión...',
      registering: 'Registrando...',
    },
    post: {
      create: 'Crear Publicación',
      publish: 'Publicar',
      publishing: 'Publicando...',
      title: 'Título',
      content: 'Contenido',
      selectCommunity: 'Seleccionar Comunidad',
      whatAreYouThinking: '¿Qué estás pensando?',
      writePost: 'Escribe tu publicación aquí...',
      noMorePosts: '😢 No hay más publicaciones',
      comments: 'Comentarios',
      comment: 'Comentar',
      commenting: 'Comentando...',
      writeComment: 'Escribe un comentario...',
      loginToComment: 'Inicia sesión para comentar',
      share: 'Compartir',
      save: 'Guardar',
      back: 'Volver',
      postedBy: 'Publicado por',
      ago: 'hace',
      hot: 'Hot',
      new: 'Nuevo',
      top: 'Top',
      all: 'Todo',
      trends: 'Tendencias',
      newPosts: 'Los posts más recientes de la comunidad',
      popularPosts: 'Los posts más populares y comentados de la comunidad',
      following: 'Siguiendo',
      forYou: 'Para Ti',
      edit: 'Editar',
      delete: 'Eliminar',
      editing: 'Editando...',
      deleting: 'Eliminando...',
      edited: 'Editado',
      editedOn: 'Editado el',
      confirmDelete: '¿Estás seguro?',
      confirmDeletePost: '¿Estás seguro de que quieres eliminar este post? Esta acción no se puede deshacer.',
      confirmDeleteComment: '¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer.',
      cancel: 'Cancelar',
    },
    community: {
      communities: 'Comunidades',
      createCommunity: 'Crear Comunidad',
      join: 'Unirse',
      leave: 'Salir',
      joined: 'Unido',
      members: 'Miembros',
      posts: 'Posts',
      postsToday: 'Posts Hoy',
      createdBy: 'Creado por',
      description: 'Descripción',
      name: 'Nombre',
      uniqueName: 'El nombre debe ser único y solo puede contener letras, números y guiones',
      public: 'Público',
      private: 'Privado',
      requiresApproval: 'Requiere Aprobación',
      joinRequest: 'Solicitud de Unión',
      approve: 'Aprobar',
      reject: 'Rechazar',
      requests: 'Solicitudes',
      noRequests: 'No hay solicitudes pendientes',
      requestedJoin: 'Solicitó unirse',
      noCommunities: 'No hay comunidades aún',
      createFirst: 'Crea la primera',
      searchCommunities: 'Buscar comunidades...',
      notFound: 'Comunidad no encontrada',
      backToHome: 'Volver al inicio',
      privateDescription: 'Comunidad privada: Los usuarios necesitarán aprobación para unirse',
    },
    sidebar: {
      quickNav: 'Navegación Rápida',
      stats: 'Discourse',
    },
    user: {
      profile: 'Perfil',
      karma: 'Karma',
      memberSince: 'Miembro desde',
      publications: 'publicaciones',
      notFound: 'Usuario no encontrado',
      followers: 'Seguidores',
      following: 'Siguiendo',
      follow: 'Seguir',
      unfollow: 'Dejar de seguir',
      editProfile: 'Editar Perfil',
      bio: 'Biografía',
      website: 'Sitio Web',
      location: 'Ubicación',
      socialLinks: 'Enlaces Sociales',
      projects: 'Proyectos',
      addProject: 'Agregar Proyecto',
      addSocialLink: 'Agregar Enlace Social',
      save: 'Guardar',
      cancel: 'Cancelar',
      interests: 'Intereses',
      selectInterests: 'Selecciona tus intereses',
      interestsDescription: 'Selecciona temas de tu interés para personalizar tu feed',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      characters: 'caracteres',
      minutes: 'minutos',
      hours: 'horas',
      days: 'días',
      seconds: 'hace unos segundos',
    },
    editor: {
      bold: 'Negrita',
      italic: 'Cursiva',
      underline: 'Subrayado',
      code: 'Código',
      quote: 'Cita',
      list: 'Lista',
      orderedList: 'Lista numerada',
      link: 'Enlace',
      imageUrl: 'Imagen (URL)',
      videoUrl: 'Video (URL)',
      enterUrl: 'Ingresa la URL:',
      enterLinkText: 'Ingresa el texto del enlace:',
      enterImageUrl: 'Ingresa la URL de la imagen:',
      enterVideoUrl: 'Ingresa la URL del video:',
      writeHere: 'Escribe tu publicación aquí...',
      tipMarkdown: '💡 Tip: Usa Markdown para formato. Ejemplo: **negrita**, *cursiva*, [enlace](url)',
    },
    mobile: {
      create: 'Crear',
    },
  },
}

