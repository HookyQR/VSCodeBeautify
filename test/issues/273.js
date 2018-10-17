module.exports = {
  extension: 'js',
  command: 'HookyQR.beautifyFile',
  beautifySetting: {
    indent_with_tabs: false,
    space_before_conditional: false,
    space_in_paren: true,
    indent_size: 2,
    indent_char: " ",
    space_after_anon_function: true,
    keep_function_indentation: true
  },
  input: `module.exports = {

    getAvgSalary: async ctx => {
        try {
          let {
            industry_code,
            city_code,
            scale_code,
            nature_code,
            education_code,
            experience_code,
            job_code
          } = ctx.query;
  
          let predictService = new PredictService( ctx );
          let data = await predictService.getJobAvgOrSort( {
            industry_code,
            city_code,
            scale_code,
            nature_code,
            job_code
          } );
  
          pr.success( ctx, data[ 0 ] );
        } catch ( error ) {
          pr.error( ctx, error );
        }
      }
  }`,
  expected: `module.exports = {

  getAvgSalary: async ctx => {
    try {
      let {
        industry_code,
        city_code,
        scale_code,
        nature_code,
        education_code,
        experience_code,
        job_code
      } = ctx.query;

      let predictService = new PredictService( ctx );
      let data = await predictService.getJobAvgOrSort( {
        industry_code,
        city_code,
        scale_code,
        nature_code,
        job_code
      } );

      pr.success( ctx, data[ 0 ] );
    } catch ( error ) {
      pr.error( ctx, error );
    }
  }
}`
};
