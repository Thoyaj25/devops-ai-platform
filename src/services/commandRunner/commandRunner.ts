import { spawn, ChildProcess } from "node:child_process";

export interface CommandOptions {
  command: string;
  args?: string[];
  cwd: string;

  env?: NodeJS.ProcessEnv;

  timeoutMs?: number;

  onStdout?: (data: string) => Promise<void> | void;

  onStderr?: (data: string) => Promise<void> | void;
}


export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}


function killProcessTree(
  child: ChildProcess
) {

  if (!child.pid) {
    return;
  }


  try {

    process.kill(
      child.pid,
      "SIGTERM"
    );


  } catch {

  }

}



export const commandRunner = {


  async run(
    options: CommandOptions
  ): Promise<CommandResult> {


    return new Promise(
      (resolve, reject) => {


        console.log(
          "[COMMAND]",
          options.command,
          options.args ?? []
        );



        const child =
          spawn(
            options.command,
            options.args ?? [],
            {
              cwd: options.cwd,

              env: {
                ...process.env,
                ...options.env,
              },

              shell:false,

              detached:true,
            }
          );



        let stdout = "";

        let stderr = "";



        const callbacks =
          new Set<Promise<void>>();




        const registerCallback =
          (
            callback?: (
              data:string
            )=>Promise<void>|void,

            data?:string
          )=>{

            if(!callback || !data){
              return;
            }


            const result =
              callback(data);


            if(
              result instanceof Promise
            ){

              const promise =
                result.finally(
                  ()=>{
                    callbacks.delete(
                      promise
                    );
                  }
                );


              callbacks.add(
                promise
              );

            }

          };





        child.stdout?.on(
          "data",
          data=>{

            const text =
              data.toString();


            stdout += text;


            registerCallback(
              options.onStdout,
              text
            );

          }
        );




        child.stderr?.on(
          "data",
          data=>{

            const text =
              data.toString();


            stderr += text;


            registerCallback(
              options.onStderr,
              text
            );

          }
        );





        let timeout:
          NodeJS.Timeout | undefined;



        let killTimeout:
          NodeJS.Timeout | undefined;



        if(
          options.timeoutMs
        ){

          timeout =
            setTimeout(
              ()=>{


                console.error(
                  `[TIMEOUT] ${options.command}`
                );


                killProcessTree(
                  child
                );


                killTimeout =
                  setTimeout(
                    ()=>{

                      try {

                        process.kill(
                          child.pid!,
                          "SIGKILL"
                        );

                      }
                      catch{}

                    },
                    5000
                  );


              },
              options.timeoutMs
            );

        }





        child.on(
          "error",
          error=>{


            if(timeout){
              clearTimeout(timeout);
            }


            if(killTimeout){
              clearTimeout(killTimeout);
            }



            reject(
              new Error(
                `Command failed: ${options.command}: ${error.message}`
              )
            );


          }
        );





        child.on(
          "close",
          async code=>{


            if(timeout){
              clearTimeout(timeout);
            }


            if(killTimeout){
              clearTimeout(killTimeout);
            }



            try{


              await Promise.all(
                Array.from(callbacks)
              );



              resolve({

                exitCode:
                  code ?? -1,

                stdout,

                stderr,

              });


            }
            catch(error){

              reject(error);

            }

          }
        );

      }
    );

  },

};